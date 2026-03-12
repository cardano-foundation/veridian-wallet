import { After, Given, When, Then } from "@wdio/cucumber-framework";
import type { DataTable } from "@cucumber/cucumber";
import { expect } from "expect-webdriverio";
import { browser, driver } from "@wdio/globals";
import ProfileSetupScreen from "../../screen-objects/onboarding/profile-setup.screen.js";
import { RemoteJoiner } from "../../helpers/backend-api.contract.js";
import { resetBackendUsers, setupBackendUser } from "../../helpers/backend-helpers.js";
import { getKeriaUrlsForTestRunner } from "../../helpers/ssi-agent-urls.helper.js";

const GROUP_ID_MISMATCH_MSG = "Connection not part of this group";

async function pageShowsMessage(msg: string): Promise<boolean> {
  return (await browser.execute((m: string) => {
    const bodyText = document.body?.innerText ?? "";
    if (bodyText.includes(m)) return true;
    const toasts = document.querySelectorAll("ion-toast");
    for (const toast of Array.from(toasts)) {
      const root = (toast as HTMLElement).shadowRoot;
      if (!root) continue;
      const messageEl = root.querySelector(".toast-message") ?? root.querySelector("[part='message']");
      if ((messageEl?.textContent?.trim() ?? "").includes(m)) return true;
    }
    return false;
  }, msg)) as boolean;
}

async function pasteOobiAndConfirm(oobi: string): Promise<void> {
  const pasteButton = $("[data-testid='paste-content-button']");
  await pasteButton.waitForDisplayed({ timeout: 10000 });
  await pasteButton.click();
  await browser.pause(800);
  const scanInput = $("[data-testid='scan-input']");
  await scanInput.waitForDisplayed({ timeout: 5000 });
  try {
    await scanInput.setValue(oobi);
  } catch {
    await browser.execute(
      (o: string) => {
        const el = document.querySelector("[data-testid='scan-input']") as HTMLInputElement & { shadowRoot?: ShadowRoot };
        if (!el) return;
        const input = el.shadowRoot?.querySelector("input") ?? el;
        if (input) {
          (input as HTMLInputElement).value = o;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("ionInput", { bubbles: true }));
        }
      },
      oobi
    );
  }
  await browser.pause(300);
  const confirmBtn = $("[data-testid='scan-input-modal'] [data-testid='action-button']");
  await confirmBtn.waitForDisplayed({ timeout: 5000 });
  await confirmBtn.click();
}

async function assertGroupProfileActiveInProfilesList(displayName: string): Promise<void> {
  const avatarBtn = $("[data-testid='avatar-button']");
  await avatarBtn.waitForDisplayed({ timeout: 10000 });
  await avatarBtn.click();
  await browser.pause(500);

  const result = await browser.execute(
    (name: string) => {
      const want = (name || "").trim().toLowerCase();
      const root = document.querySelector("[data-testid='profiles']");
      if (!root) return { active: false, reason: "profiles panel not found", profileId: null as string | null };
      const items = root.querySelectorAll("[data-testid^='profiles-list-item-']");
      for (const item of items) {
        const nameEl = item.querySelector(".profiles-list-item-name");
        const currentName = (nameEl?.textContent?.trim() ?? "").toLowerCase();
        if (currentName !== want) continue;
        const testId = item.getAttribute("data-testid") ?? "";
        const id = testId.replace(/^profiles-list-item-/, "");
        const hasPending = !!item.querySelector("[data-testid='profiles-list-item-pending-" + id + "-status']");
        const hasAction = !!item.querySelector("[data-testid='profiles-list-item-action-" + id + "-status']");
        return {
          active: !hasPending && !hasAction,
          reason: hasPending ? "pending" : hasAction ? "action_required" : "ok",
          profileId: id || null,
        };
      }
      return { active: false, reason: "profile not found", profileId: null as string | null };
    },
    displayName
  );

  if (!result?.active) {
    throw new Error(
      `Group profile "${displayName}" is not active in Profiles list (reason: ${result?.reason ?? "unknown"}). Expected: no pending/action chip so "Manage profile" is available.`
    );
  }

  if (result?.profileId) {
    const profileListItem = $(`[data-testid='profiles-list-item-${result.profileId}']`);
    await profileListItem.waitForDisplayed({ timeout: 5000 });
    await profileListItem.click();
    await browser.pause(500);
  }

  const manageProfileBtn = $("[data-testid='profiles-option-button-manage profile']");
  await manageProfileBtn.waitForDisplayed({ timeout: 5000 });
  await manageProfileBtn.click();
  await browser.pause(500);
}

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

Given(/^Alice creates a group profile as initiator$/, async function () {
  const world = this as AliceInitiatorWorld;
  const groupName = "MultisigGroup";
  world.aliceInitiatorGroupName = groupName;

  await ProfileSetupScreen.selectGroupProfile();
  await ProfileSetupScreen.confirmButton.click();
  await ProfileSetupScreen.waitForGroupSetupScreen();
  await ProfileSetupScreen.enterGroupName(groupName);
  await browser.pause(500);
  await ProfileSetupScreen.confirmButton.click();
  await ProfileSetupScreen.waitForProfileSetupScreen();
  await ProfileSetupScreen.enterUsername("Alice");
  await browser.pause(500);
  await ProfileSetupScreen.confirmButton.click();
  await ProfileSetupScreen.waitForWelcomeScreen();
  await expect(ProfileSetupScreen.continueButton).toBeDisplayed();
  await ProfileSetupScreen.continueButton.click();

  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("group-profile-setup") || url.includes("/tabs/home") || url.includes("/home");
    },
    { timeout: 15000, timeoutMsg: "Did not navigate to group-profile-setup or Homepage after Welcome" }
  );
  await browser.pause(2000);

  // Capture Alice's OOBI for members
  const provideTab = $("[data-testid='share-oobi-segment-button']");
  await provideTab.waitForDisplayed({ timeout: 10000 });
  await provideTab.click();
  const installShareCapture = `
    (function() {
      window.__lastSharedOobi = undefined;
      var cap = window.Capacitor;
      if (!cap || typeof cap.nativePromise !== 'function') return;
      var orig = cap.nativePromise.bind(cap);
      cap.nativePromise = function(pluginName, methodName, options) {
        if (pluginName === 'Share' && methodName === 'share' && options && options.text)
          window.__lastSharedOobi = options.text;
        return orig(pluginName, methodName, options);
      };
    })();
  `;
  await browser.execute(installShareCapture);

  const shareButton = $(".share-profile-oobi .share-button");
  await shareButton.waitForDisplayed({ timeout: 8000 });
  await shareButton.scrollIntoView?.().catch(() => { });
  await shareButton.click();
  const aliceOobiUrl = (await browser.execute(() => (window as unknown as { __lastSharedOobi?: string }).__lastSharedOobi)) as string | undefined;
  if (!aliceOobiUrl) throw new Error("Could not capture Alice's OOBI");
  world.aliceSharedOobi = aliceOobiUrl;

  const aliceGroupId = new URL(aliceOobiUrl).searchParams.get("groupId");
  world.aliceInitiatorGroupId = aliceGroupId;
  await driver.pressKeyCode(4);
  await browser.pause(500);
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
      const wallet = await setupBackendUser(name);
      await wallet.generateOobi();
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
    await scanTab.waitForDisplayed({ timeout: 10000 });
    await scanTab.click();
    await browser.pause(200);

    if (!member.oobi) throw new Error(`OOBI missing for member ${name}`);

    const url = new URL(member.oobi);

    // Add required query params
    url.searchParams.set("groupId", world.aliceInitiatorGroupId!);
    url.searchParams.set("groupName", world.aliceInitiatorGroupName ?? "MultisigGroup");
    url.searchParams.set("name", name);

    const oobiForApp = url.toString();

    await pasteOobiAndConfirm(oobiForApp);
    await browser.pause(200);
  }

});

When(/^Alice initiates the group identifier$/, async function () {
  const provideTab = $("[data-testid='share-oobi-segment-button']");
  await provideTab.waitForDisplayed({ timeout: 10000 });
  await provideTab.click();
  await browser.pause(500);
  const initiateBtn = $("[data-testid='primary-button-setup-group-profile']");
  await initiateBtn.waitForDisplayed({ timeout: 10000 });
  await initiateBtn.click();
  await browser.pause(500);
  const alertConfirmBtn = $("[data-testid='alert-confirm-init-group-confirm-button']");
  await alertConfirmBtn.waitForDisplayed({ timeout: 5000 });
  await alertConfirmBtn.click();
  await browser.pause(500);

  await browser.waitUntil(
    async () => (await $("[data-testid='init-group-footer']").isDisplayed().catch(() => false)) || (await $("[data-testid='signer-alert-card-block']").isDisplayed().catch(() => false)),
    { timeout: 15000, timeoutMsg: "Confirm (InitializeGroup) screen did not load" }
  );
  await browser.pause(500);
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
    await browser.pause(300);
    await signerAlertBtn.click();
  } else {
    const setSignersFallback = $("[data-testid='signer-alert-card-block'] button");
    if (await setSignersFallback.isDisplayed().catch(() => false)) {
      await setSignersFallback.scrollIntoView?.().catch(() => { });
      await browser.pause(300);
      await setSignersFallback.click();
    } else {
      throw new Error("Set signers control not found on Confirm screen");
    }
  }
  await browser.pause(500);
  const requiredIncrease = $("[data-testid='requiredSigners-increase-threshold-button']");
  const recoveryIncrease = $("[data-testid='recoverySigners-increase-threshold-button']");
  await requiredIncrease.waitForDisplayed({ timeout: 5000 });
  for (let i = 0; i < required; i++) {
    await requiredIncrease.click();
    await browser.pause(200);
  }
  for (let i = 0; i < recovery; i++) {
    await recoveryIncrease.click();
    await browser.pause(200);
  }
  const signerModalConfirm = $("[data-testid='primary-button-setup-signer-modal']");
  await signerModalConfirm.waitForDisplayed({ timeout: 5000 });
  await signerModalConfirm.click();
  await browser.pause(1000);
});

When(/^Alice sends the group requests$/, async function () {
  const sendRequestBtn = $("[data-testid='primary-button-init-group']");
  await sendRequestBtn.waitForDisplayed({ timeout: 10000 });
  await browser.pause(500);
  await sendRequestBtn.click();
  await browser.pause(3000);
});

When(/^all members accept the group invitation$/, async function () {
  const world = this as AliceInitiatorWorld;
  if (!world.virtualMembers) throw new Error("No virtual members to accept invitations");

  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.acceptGroupInvitation(60000);
  }
  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.waitPendingOperations();
  }
  // propose their endorsement before processing incoming ones.
  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.authorizeGroupAgents("MultisigGroup");
  }
  // every member processes all incoming endorsements and anchors them locally.
  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.processIncomingGroupAgentsEndorcements("MultisigGroup");
  }
  for (const member of Object.values(world.virtualMembers)) {
    await member.instance.waitPendingOperations();
  }
});

Then(/^the group status becomes "Active" when the group is ready$/, async function () {
  const aliceInitiatorGroupName = (this as { aliceInitiatorGroupName?: string }).aliceInitiatorGroupName;
  if (!aliceInitiatorGroupName) {
    throw new Error("Missing aliceInitiatorGroupName from Given step.");
  }

  if (await pageShowsMessage(GROUP_ID_MISMATCH_MSG)) {
    throw new Error("Connection not part of this group — scan rejected.");
  }

  try {
    await ProfileSetupScreen.waitForGroupActive(60000);
    await assertGroupProfileActiveInProfilesList(aliceInitiatorGroupName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }
  const url = await browser.getUrl();
  const onHome = url.includes("/tabs/home") || url.includes("/home");
  if (onHome) {
    const homeTab = await $("[data-testid='tab-button-home']").isExisting().catch(() => false);
    expect(homeTab).toBe(true);
  }
});

After(function () {
  resetBackendUsers();
});
