import { Given, When, Then } from "@wdio/cucumber-framework";
import type { DataTable } from "@cucumber/cucumber";
import { expect } from "expect-webdriverio";
import { browser, driver } from "@wdio/globals";
import ProfileSetupScreen from "../../screen-objects/onboarding/profile-setup.screen.js";
import { RemoteJoiner } from "../../helpers/virtual-wallet.js";
import { createVirtualWallet } from "../../helpers/virtual-wallet.factory.js";
import { getKeriaUrlsForTestRunner } from "../../helpers/ssi-agent-urls.helper.js";
import {
  toastContainsText,
  pasteOobiAndConfirm,
  assertGroupProfileActiveInProfilesList,
  waitUpTo,
  installShareCapture,
} from "./group-profile.helpers.js";

const GROUP_ID_MISMATCH_MSG = "Connection not part of this group";

type AliceInitiatorWorld = {
  aliceInitiatorGroupName?: string;
  aliceInitiatorGroupId?: string | null;
  virtualMembers?: Record<
    string,
    {
      instance: RemoteJoiner;
      oobi: string;
    }
  >;
  aliceSharedOobi?: string;
};

Given(/^Alice creates a group profile as initiator for (\d+)-of-(\d+) group "([^"]+)"$/,
  async function (requiredStr: string, recoveryStr: string, baseGroupName: string) {
    const world = this as AliceInitiatorWorld;

    const required = parseInt(requiredStr, 10);
    const recovery = parseInt(recoveryStr, 10);
    const groupName = `${baseGroupName}-${required}o${recovery}`;
    world.aliceInitiatorGroupName = groupName;

    await ProfileSetupScreen.selectGroupProfile();
    await ProfileSetupScreen.confirmButton.click();
    await ProfileSetupScreen.waitForGroupSetupScreen();
    await ProfileSetupScreen.enterGroupName(groupName);
    await ProfileSetupScreen.confirmButton.click();
    await ProfileSetupScreen.waitForProfileSetupScreen();
    await ProfileSetupScreen.enterUsername("Alice");
    await ProfileSetupScreen.confirmButton.click();
    await ProfileSetupScreen.waitForWelcomeScreen();
    await expect(ProfileSetupScreen.continueButton).toBeDisplayed();
    await ProfileSetupScreen.continueButton.click();

    await waitUpTo(
      async () => {
        const url = await browser.getUrl();
        return url.includes("group-profile-setup");
      },
      5000
    );

    // Capture Alice's OOBI for members
    const provideTab = $("[data-testid='share-oobi-segment-button']");
    await provideTab.waitForDisplayed();
    await provideTab.click();
    await installShareCapture();

    const shareButton = $(".share-profile-oobi .share-button");
    await shareButton.waitForDisplayed();
    await shareButton.scrollIntoView?.().catch(() => { });
    await shareButton.click();
    const aliceOobiUrl = (await browser.execute(() => (window as unknown as { __lastSharedOobi?: string }).__lastSharedOobi)) as string | undefined;
    if (!aliceOobiUrl) throw new Error("Could not capture Alice's OOBI");
    world.aliceSharedOobi = aliceOobiUrl;

    const aliceGroupId = new URL(aliceOobiUrl).searchParams.get("groupId");
    world.aliceInitiatorGroupId = aliceGroupId;
    await driver.pressKeyCode(4);
  });

Given(
  /^the following members resolve each others' OOBIs and create member ids:$/,
  async function (dataTable: DataTable) {
    const world = this as AliceInitiatorWorld;
    if (!world.aliceSharedOobi || !world.aliceInitiatorGroupId) {
      throw new Error("Alice OOBI must be captured first.");
    }

    const members = dataTable.hashes().flatMap(r => r.name.split(',').map(name => name.trim()));
    console.log(members)
    const hostUrls = getKeriaUrlsForTestRunner();
    world.virtualMembers = {};

    // Step 1: Create all virtual wallets
    for (const name of members) {
      const wallet = await createVirtualWallet(name);
      await wallet.getOobi();
      world.virtualMembers[name] = { instance: wallet, oobi: "" };
    }

    // Step 2: Resolve Alice for all members and generate their OOBIs
    for (const [name, { instance }] of Object.entries(world.virtualMembers)) {
      if (!instance.oobi) throw new Error("Could not generate OOBI for member");
      await instance.resolveOobi(world.aliceSharedOobi!, "Alice");
      const url = new URL(instance.oobi);
      url.hostname = new URL(hostUrls.connectUrl).hostname;
      world.virtualMembers[name].oobi = url.toString();
    }

    // Step 3: Resolve each others' OOBIs
    const memberEntries = Object.entries(world.virtualMembers);
    for (let i = 0; i < memberEntries.length; i++) {
      for (let j = 0; j < memberEntries.length; j++) {
        if (i === j) continue;
        await memberEntries[i][1].instance.resolveOobi(memberEntries[j][1].oobi, memberEntries[j][0]);
      }
    }
  }
);

When(/^Alice pastes all member OOBIs on the Scan tab$/, async function () {
  const world = this as AliceInitiatorWorld;
  if (!world.virtualMembers) throw new Error("No virtual members found");

  const scanTab = $("[data-testid='scan-profile-segment-button']");

  for (const [name, member] of Object.entries(world.virtualMembers)) {
    await scanTab.waitForDisplayed();
    await scanTab.click();

    const oobiForApp = await member.instance.getOobi({
      groupId: world.aliceInitiatorGroupId!,
      groupName: world.aliceInitiatorGroupName!,
      alias: name
    });

    await pasteOobiAndConfirm(oobiForApp);
    if (await toastContainsText(GROUP_ID_MISMATCH_MSG)) {
      throw new Error(`Group ID mismatch for member ${name} — scan rejected.`);
    }
  }

});

When(/^Alice initiates the group identifier$/, async function () {
  const provideTab = $("[data-testid='share-oobi-segment-button']");
  await provideTab.waitForDisplayed();
  await provideTab.click();
  const initiateBtn = $("[data-testid='primary-button-setup-group-profile']");
  await initiateBtn.waitForDisplayed();
  await initiateBtn.click();
  const alertConfirmBtn = $("[data-testid='alert-confirm-init-group-confirm-button']");
  await alertConfirmBtn.waitForDisplayed();
  await alertConfirmBtn.click();

  await waitUpTo(
    async () =>
      (await $("[data-testid='init-group-footer']").isDisplayed().catch(() => false)) ||
      (await $("[data-testid='signer-alert-card-block']").isDisplayed().catch(() => false)),
    15000
  );
});

When(/^Alice sets required and recovery signers to (\d+) and (\d+)$/, async function (requiredStr: string, recoveryStr: string) {
  const required = parseInt(requiredStr, 10);
  const recovery = parseInt(recoveryStr, 10);
  if (required < 1 || recovery < 1) {
    throw new Error("Required and recovery signers must be at least 1");
  }
  const signerAlertBtn = $("[data-testid='signer-alert-card-block'] .secondary-button");
  const signerAlertVisible = await signerAlertBtn.isDisplayed().catch(() => false);
  if (signerAlertVisible) {
    await signerAlertBtn.scrollIntoView?.().catch(() => { });
    await signerAlertBtn.click();
  } else {
    const setSignersFallback = $("[data-testid='signer-alert-card-block'] button");
    if (await setSignersFallback.isDisplayed().catch(() => false)) {
      await setSignersFallback.scrollIntoView?.().catch(() => { });
      await setSignersFallback.click();
    } else {
      throw new Error("Set signers control not found on Confirm screen");
    }
  }
  const requiredIncrease = $("[data-testid='requiredSigners-increase-threshold-button']");
  const recoveryIncrease = $("[data-testid='recoverySigners-increase-threshold-button']");
  await requiredIncrease.waitForDisplayed();
  for (let i = 0; i < required; i++) {
    await requiredIncrease.click();
  }
  for (let i = 0; i < recovery; i++) {
    await recoveryIncrease.click();
  }
  const signerModalConfirm = $("[data-testid='primary-button-setup-signer-modal']");
  await signerModalConfirm.waitForDisplayed();
  await signerModalConfirm.click();
});

When(/^Alice sends the group requests$/, async function () {
  const sendRequestBtn = $("[data-testid='primary-button-init-group']");
  await sendRequestBtn.waitForDisplayed();
  await sendRequestBtn.click();
});

When(/^all members accept the group invitation$/, async function () {
  const world = this as AliceInitiatorWorld;
  if (!world.virtualMembers) throw new Error("No virtual members to accept invitations");
  if (!world.aliceInitiatorGroupName) throw new Error("No aliceInitiatorGroupName");

  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.acceptGroupInvitation(60000, world.aliceInitiatorGroupName);
  }
  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.waitPendingOperations();
  }
  // propose their endorsement before processing incoming ones.
  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.authorizeGroupAgents(world.aliceInitiatorGroupName);
  }
  // every member processes all incoming endorsements and anchors them locally.
  console.log("Members processing incoming endorsements...");
  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.processIncomingGroupAgentsEndorcements(world.aliceInitiatorGroupName);
  }
  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.waitPendingOperations();
  }
});

Then(/^the group status becomes "Active" when the group is ready$/, async function () {
  const aliceInitiatorGroupName = (this as { aliceInitiatorGroupName?: string }).aliceInitiatorGroupName;
  if (!aliceInitiatorGroupName) throw new Error("Missing aliceInitiatorGroupName from Given step.");

  await ProfileSetupScreen.waitForGroupActive(30000);
  await assertGroupProfileActiveInProfilesList(aliceInitiatorGroupName);
  const url = await browser.getUrl();
  if (!url.includes("/tabs/home")) {
    throw new Error(`Expected to be redirected to home after group activation, but current URL is ${url}`);
  }
  const homeTab = await $("[data-testid='tab-button-home']").isExisting();
  if (!homeTab) {
    throw new Error("Home tab not found after group activation");
  }
});
