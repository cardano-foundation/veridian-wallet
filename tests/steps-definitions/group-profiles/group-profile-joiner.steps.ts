import { Given, When, Then } from "@wdio/cucumber-framework";
import type { DataTable } from "@cucumber/cucumber";
import { browser, driver } from "@wdio/globals";
import ProfileSetupScreen from "../../screen-objects/onboarding/profile-setup.screen.js";
import { RemoteInitiator, RemoteJoiner } from "../../helpers/virtual-wallet.js";
import { createRemoteInitiator, createVirtualWallet } from "../../helpers/virtual-wallet.factory.js";
import {
  getKeriaUrlsForTestRunner,
} from "../../helpers/ssi-agent-urls.helper.js";
import {
  pageContainsText,
  toastContainsText,
  dismissLockScreenIfPresent,
  waitUpTo,
  getPendingGroupPrimaryButtonText,
  getLatestToastMessage,
  getConnectedMembersProgressText,
  pasteOobiAndConfirm,
  assertGroupProfileActiveInProfilesList,
  extractAidFromOobi,
  normalizeOobiHostname,
  installShareCapture,
} from "./group-profile.helpers.js";

const GROUP_ID_MISMATCH_MSG = "Connection not part of this group";
const GENERIC_CONNECTION_ERROR_MSG = "Something went wrong. Please try again.";

// ---------------------------------------------------------------------------
// World context shared across steps in one scenario
// ---------------------------------------------------------------------------

type BobJoinerWorld = {
  bobGroupName?: string;
  /** Alice's OOBI with pendingGroupId, ready for Bob to paste in the Join-Group scan screen */
  aliceOobiForJoin?: string;
  /** Bob's raw OOBI captured from the app's Share tab */
  bobSharedOobi?: string;
  remoteInitiator?: RemoteInitiator;
  extraVirtualMembers?: Record<string, RemoteJoiner>;
  /** KERI prefix of the created multisig group */
  groupId?: string;
  /** Alice's personal AID — used as pendingGroupId in extra-member OOBIs so the
   *  app can match them to the correct pending group invitation */
  aliceAid?: string;
};

// ---------------------------------------------------------------------------
// Step 1 (BACKEND) - Alice creates a pending group so Bob can join
// ---------------------------------------------------------------------------

Given(
  /^the remote initiator "([^"]+)" creates a pending (\d+)-of-(\d+) group "([^"]+)"$/,
  async function (initiatorName: string, required: string, recovery: string, baseGroupName: string) {
    const world = this as BobJoinerWorld;

    const groupName = `${baseGroupName}-${required}o${recovery}`;
    world.bobGroupName = groupName;

    const testRunnerUrls = getKeriaUrlsForTestRunner();

    // Create remote initiator
    const initiator = await createRemoteInitiator(initiatorName);
    world.remoteInitiator = initiator;

    await initiator.getOobi();

    const initiatorAid = await initiator.getAid();
    world.aliceAid = initiatorAid;

    const rawOobi = await initiator.getOobi({
      alias: initiatorName,
      groupId: initiatorAid,
      groupName,
    });

    world.aliceOobiForJoin = normalizeOobiHostname(
      rawOobi,
      testRunnerUrls.connectUrl
    );
  }
);

// ---------------------------------------------------------------------------
// Step 2 (UI) - Bob clicks "Join Group", pastes Alice's OOBI, creates member AID
// ---------------------------------------------------------------------------

Given(/^Bob scans Alice's group OOBI to join as a member$/, async function () {
  const world = this as BobJoinerWorld;
  if (!world.aliceOobiForJoin) {
    throw new Error(
      "Alice's OOBI is not ready. Run the 'remote initiator creates a pending group' step first."
    );
  }

  // ── Profile type selection ────────────────────────────────────────────────
  await ProfileSetupScreen.selectGroupProfile();
  await ProfileSetupScreen.confirmButton.click();
  await ProfileSetupScreen.waitForGroupSetupScreen();

  // ── Click "Join Group" → QR scan screen opens ────────────────────────────
  await ProfileSetupScreen.joinGroupButton.waitForDisplayed();
  await ProfileSetupScreen.joinGroupButton.click();

  // ── Paste Alice's OOBI (with groupId) on the scan screen ─────────────────
  await pasteOobiAndConfirm(world.aliceOobiForJoin);

  // ── Step A: GroupSetupConfirm ─────────────────────────────────────────────
  await waitUpTo(
    async () => {
      const confirmScreenExists = await $(".join-group-details")
        .isExisting()
        .catch(() => false);
      return confirmScreenExists;
    },
    3000
  );
  console.log("[Bob] GroupSetupConfirm screen detected - clicking Next: setup profile");
  await $("[data-testid='primary-button-profile-setup']").click();

  // ── Step B: SetupProfile (username input) ────────────────────────────────
  await ProfileSetupScreen.waitForProfileSetupScreen();
  await ProfileSetupScreen.enterUsername("Bob");
  await $("[data-testid='primary-button-profile-setup']").click();
  console.log("[Bob] Submitted username - waiting for Welcome screen");

  // ── Step C: FinishSetup (Welcome / Get started) ───────────────────────────
  await waitUpTo(
    async () => {
      const welcomeExists = await ProfileSetupScreen.welcomeTitle
        .isExisting()
        .catch(() => false);
      const url = await browser.getUrl().catch(() => "");
      return welcomeExists || url.includes("group-profile-setup");
    },
    3000
  );
  const urlAfterCreate = await browser.getUrl().catch(() => "");
  if (!urlAfterCreate.includes("group-profile-setup")) {
    console.log("[Bob] Welcome screen detected - clicking Get started");
    await $("[data-testid='primary-button-profile-setup']").click();
  }

  // ── Step D: Wait for group-profile-setup page ────────────────────────────
  await waitUpTo(
    async () => {
      const url = await browser.getUrl();
      return url.includes("group-profile-setup");
    },
    3000
  );
  console.log("[Bob] Reached group-profile-setup page");

  // ── Capture Bob's OOBI from the Share (Provide) tab ──────────────────────
  await waitUpTo(
    async () => {
      const provideTab = $("[data-testid='share-oobi-segment-button']");
      const isVisible = await provideTab.isDisplayed().catch(() => false);
      if (!isVisible) return false;
      await provideTab.click();
      return $(".share-profile-oobi").isExisting().catch(() => false);
    },
    3000
  );
  console.log("[Bob] Provide tab activated - waiting for OOBI to load");

  await installShareCapture();

  await waitUpTo(
    async () => {
      const revealed = await $(".share-profile-body-component.share-qr.reveal")
        .isExisting()
        .catch(() => false);
      return revealed;
    },
    3000
  );
  console.log("[Bob] OOBI QR code revealed - clicking share button");

  const shareButton = $(".share-profile-oobi .share-button");
  await shareButton.waitForDisplayed();
  await shareButton.scrollIntoView?.().catch(() => { });

  let bobOobiUrl: string | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await shareButton.click();
    await waitUpTo(
      async () => {
        const shared = (await browser.execute(
          () =>
            (window as unknown as { __lastSharedOobi?: string }).__lastSharedOobi
        )) as string | undefined;
        return (shared?.length ?? 0) > 0;
      }
    ).catch(() => { });
    bobOobiUrl = (await browser.execute(
      () =>
        (window as unknown as { __lastSharedOobi?: string }).__lastSharedOobi
    )) as string | undefined;
    if (bobOobiUrl) break;
    console.log(`[Bob] Share attempt ${attempt}: OOBI not captured yet, retrying…`);
  }

  if (!bobOobiUrl) {
    throw new Error("Could not capture Bob's OOBI from the Share button after 3 attempts");
  }
  world.bobSharedOobi = bobOobiUrl;

  await driver.pressKeyCode(4);
  // allow the back navigation to settle by waiting for group-profile-setup or profiles to exist
  await waitUpTo(
    async () => {
      const url = await browser.getUrl().catch(() => "");
      if (url.includes("group-profile-setup")) return true;
      return (await $("[data-testid='profiles']").isExisting().catch(() => false));
    }
  ).catch(() => { });
});

// ---------------------------------------------------------------------------
// Step 3 (BACKEND) - Alice + extra virtual members resolve Bob's OOBI
// ---------------------------------------------------------------------------

Given(
  /^Alice and the following extra virtual members resolve Bob's OOBI:$/,
  async function (dataTable: DataTable) {
    const world = this as BobJoinerWorld;
    if (!world.bobSharedOobi) {
      throw new Error(
        "Bob's OOBI must be captured first (run the 'Bob scans Alice's OOBI' step)."
      );
    }
    if (!world.remoteInitiator) {
      throw new Error(
        "Remote initiator (Alice) is not set up. Run the 'remote initiator creates a pending group' step first."
      );
    }

    const testRunnerUrls = getKeriaUrlsForTestRunner();

    const extraNames = dataTable
      .hashes()
      .flatMap((r) => r.name.split(",").map((n: string) => n.trim()))
      .filter((n) => n.length > 0);

    world.extraVirtualMembers = {};

    for (const name of extraNames) {
      const joiner = await createVirtualWallet(name);
      world.extraVirtualMembers[name] = joiner;
      await joiner.getOobi();
      console.log(`[${name}] Virtual member created`);
    }

    const bobOobiForBackend = normalizeOobiHostname(
      world.bobSharedOobi!,
      testRunnerUrls.connectUrl
    );

    const aliceOobiForBackend = normalizeOobiHostname(
      world.remoteInitiator.oobi!,
      testRunnerUrls.connectUrl
    );

    await world.remoteInitiator.resolveOobi(bobOobiForBackend, "Bob");
    console.log("[Alice] Resolved Bob's OOBI");

    for (const [name, joiner] of Object.entries(world.extraVirtualMembers)) {
      await joiner.resolveOobi(bobOobiForBackend, "Bob");
      await joiner.resolveOobi(aliceOobiForBackend, "Alice");

      const joinerOobiForBackend = normalizeOobiHostname(
        joiner.oobi!,
        testRunnerUrls.connectUrl
      );
      await world.remoteInitiator.resolveOobi(joinerOobiForBackend, name);
      console.log(`[Alice] Resolved ${name}'s OOBI`);
      console.log(`[${name}] Resolved Alice's and Bob's OOBIs`);
    }

    const extraEntries = Object.entries(world.extraVirtualMembers);
    for (let i = 0; i < extraEntries.length; i++) {
      for (let j = 0; j < extraEntries.length; j++) {
        if (i === j) continue;
        const [jName, jJoiner] = extraEntries[j];
        const jOobiNorm = normalizeOobiHostname(
          jJoiner.oobi!,
          testRunnerUrls.connectUrl
        );
        await extraEntries[i][1].resolveOobi(jOobiNorm, jName);
      }
    }
  }
);

// ---------------------------------------------------------------------------
// Step 4 (BACKEND) - Alice creates the actual KERI group and proposes it
// ---------------------------------------------------------------------------

When(
  /^Alice creates a (\d+)-of-(\d+) multisig group "([^"]+)" and proposes it to all members$/,
  async function (requiredStr: string, recoveryStr: string, baseGroupName: string) {
    const world = this as BobJoinerWorld;
    if (!world.remoteInitiator) throw new Error("Remote initiator (Alice) is not set up.");
    if (!world.bobSharedOobi) throw new Error("Bob's OOBI has not been captured.");

    const required = parseInt(requiredStr, 10);
    const recovery = parseInt(recoveryStr, 10);

    const groupName = `${baseGroupName}-${required}o${recovery}`;
    world.bobGroupName = groupName;

    const bobAid = extractAidFromOobi(world.bobSharedOobi);

    const extraAids: string[] = await Promise.all(
      Object.values(world.extraVirtualMembers ?? {}).map((m) => m.getAid())
    );

    const joinerAids = [bobAid, ...extraAids];

    const { groupId } = await world.remoteInitiator.createAndProposeGroup(
      groupName,
      joinerAids,
      { isith: required, nsith: recovery }
    );
    world.groupId = groupId;

    console.log(
      `[Alice] Group "${groupName}" (id: ${groupId}) created and proposed to: ${joinerAids.join(", ")}`
    );
  }
);

// ---------------------------------------------------------------------------
// Step 5 (UI) - Bob accepts the group invitation in the app
// ---------------------------------------------------------------------------

When(/^Bob accepts the group invitation in the app$/, async function () {
  const world = this as BobJoinerWorld;
  const testRunnerConnectUrl = getKeriaUrlsForTestRunner().connectUrl;
  const groupName = world.bobGroupName ?? "MultisigGroup";
  const groupId = world.groupId;

  // For 2-of-3 and 3-of-3: Bob may see ErrorPage ("missing connections") because
  // the app requires Bob to have connections with ALL group members. Bob only
  // scanned Alice; Charlie is a virtual backend member. Bob must add Charlie's
  // OOBI before the Accept button appears.
  const extraMembers = Object.entries(world.extraVirtualMembers ?? {});
  let addedAnyMember = false;
  for (const [name, joiner] of extraMembers) {
    // Wait for the PendingGroup page to appear first (app receives KERI notification
    // asynchronously), then check for the missing connections alert. Checking
    // immediately at step start would always return false because Bob is still
    // on group-profile-setup (Provide tab) and the alert only renders on PendingGroup.
    let missingConnectionsAlert = false;
    try {
      await browser.waitUntil(
        async () => {
          missingConnectionsAlert = await pageContainsText(
            "You are missing one or more connections required for this group request"
          ).catch(() => false);
          return missingConnectionsAlert;
        },
        { timeout: 30000, interval: 1000 }
      );
    } catch {
      // alert did not appear within 30 s — no missing connections for this member
    }
    if (!missingConnectionsAlert) break;

    console.log(`[Bob] Adding missing connection: ${name}`);
    // Use aliceAid as groupId — the app identifies the pending group by Alice's
    // AID (the same value Alice embedded in her own OOBI). Using world.groupId
    // (the multisig group AID) would cause "Connection not part of this group".
    const rawOobi = await joiner.getOobi({
      alias: name,
      groupId: world.aliceAid ?? groupId ?? "",
      groupName,
    });
    const charlieOobiForApp = normalizeOobiHostname(
      rawOobi,
      testRunnerConnectUrl
    );
    const connectedMembersBefore = await getConnectedMembersProgressText();

    // isDisplayed() can return false even when the button exists (checkVisibility
    // fails due to parent opacity/overflow). Wait for DOM presence then JS-click.
    await waitUpTo(
      async () => $("[data-testid='primary-button-pending-group']")
        .isExisting()
        .catch(() => false),
      3000
    );
    await browser.execute(() => {
      const btn = document.querySelector(
        "[data-testid='primary-button-pending-group']"
      ) as HTMLElement | null;
      if (btn) btn.click();
    });
    // wait for ShareProfile UI to appear
    await $("[data-testid='scan-profile-segment-button']").waitForExist({
      timeout: 5000,
    }).catch(() => { });

    // ShareProfile opens with Provide tab by default; paste button is on Scan tab
    const scanTab = $("[data-testid='scan-profile-segment-button']");
    if (await scanTab.isExisting().catch(() => false)) {
      await scanTab.click();
      await $("[data-testid='paste-content-button']").waitForDisplayed();
    }

    // useJsClick: native camera overlay blocks touch; JS click bypasses it
    await pasteOobiAndConfirm(charlieOobiForApp, true);
    // wait for scan modal to close (pasteOobiAndConfirm already waits, but keep safe)
    await $("[data-testid='scan-input-modal']").waitForExist({
      reverse: true,
      timeout: 5000,
    }).catch(() => { });

    if (await toastContainsText(GENERIC_CONNECTION_ERROR_MSG)) {
      throw new Error(
        `Scanning ${name}'s OOBI failed with generic connection error. OOBI pasted: ${charlieOobiForApp}`
      );
    }
    if (await toastContainsText(GROUP_ID_MISMATCH_MSG)) {
      throw new Error(
        `Scanning ${name}'s OOBI failed with group-id mismatch. OOBI pasted: ${charlieOobiForApp}`
      );
    }

    // If the scan-input-modal is still open (edge case), dismiss it first
    const scanModal = $("[data-testid='scan-input-modal']");
    if (await scanModal.isDisplayed().catch(() => false)) {
      await driver.pressKeyCode(4);
      await $("[data-testid='scan-input-modal']").waitForExist({
        reverse: true,
        timeout: 2000,
      }).catch(() => { });
    }

    // After the OOBI is submitted the scan modal closes but ShareProfile screen
    // is still on top of PendingGroup. Press Back to return to PendingGroup so
    // the "Continue setup" button becomes visible.
    await driver.pressKeyCode(4);
    await browser.waitUntil(
      async () => {
        return $("[data-testid='primary-button-pending-group']").isExisting().catch(() => false);
      },
      { timeout: 10000, interval: 500, timeoutMsg: "PendingGroup primary button did not reappear after navigating back" }
    );

    let connectedMembersAfter = await getConnectedMembersProgressText();
    let primaryButtonText = await getPendingGroupPrimaryButtonText();

    if (!/continue setup/i.test(primaryButtonText)) {
      await waitUpTo(
        async () => {
          primaryButtonText = await getPendingGroupPrimaryButtonText();
          connectedMembersAfter = await getConnectedMembersProgressText();
          return (
            /continue setup/i.test(primaryButtonText) ||
            connectedMembersAfter !== connectedMembersBefore
          );
        },
        3000
      );
    }

    if (await toastContainsText(GENERIC_CONNECTION_ERROR_MSG)) {
      throw new Error(
        `Scanning ${name}'s OOBI did not add the member. toast="${await getLatestToastMessage()}" before="${connectedMembersBefore}" after="${connectedMembersAfter}" oobi="${charlieOobiForApp}"`
      );
    }
    if (await toastContainsText(GROUP_ID_MISMATCH_MSG)) {
      throw new Error(
        `Scanning ${name}'s OOBI failed with group-id mismatch. before="${connectedMembersBefore}" after="${connectedMembersAfter}" oobi="${charlieOobiForApp}"`
      );
    }

    addedAnyMember = true;
  }

  if (addedAnyMember) {
    await browser.waitUntil(
      async () => {
        const text = await getPendingGroupPrimaryButtonText();
        return /continue setup/i.test(text);
      },
      { timeout: 30000, timeoutMsg: "Continue setup button did not appear" }
    );
    await browser.execute(() => {
      const btn = document.querySelector(
        "[data-testid='primary-button-pending-group']"
      ) as HTMLElement | null;
      if (btn) btn.click();
    });
    await browser.waitUntil(
      async () => {
        const text = await getPendingGroupPrimaryButtonText();
        return /accept/i.test(text);
      },
      { timeout: 30000, timeoutMsg: "Accept button did not appear after Continue setup" }
    );
  }

  await browser.waitUntil(
    async () => {
      const text = await getPendingGroupPrimaryButtonText();
      return /accept/i.test(text);
    },
    {
      timeout: 60000,
      timeoutMsg:
        "PendingGroup Accept button did not appear for Bob within 60 s",
    }
  );

  await browser.waitUntil(
    async () => {
      const spinner = $(".spinner-overlay");
      return !(await spinner.isExisting() && await spinner.isDisplayed());
    },
    { timeout: 15000, interval: 500, timeoutMsg: "Spinner did not disappear" }
  );

  // Auto-lock can trigger during the long OOBI-resolve wait — dismiss before Accept
  await dismissLockScreenIfPresent();

  console.log("[Bob] Clicking Accept on PendingGroup screen");
  await browser.execute(() => {
    const btn = document.querySelector(
      "[data-testid='primary-button-pending-group']"
    ) as HTMLElement | null;
    if (btn) btn.click();
  });

  // wait for navigation / URL change after Accept (exits early if it happens)
  await waitUpTo(
    async () => {
      const url = await browser.getUrl();
      return url.includes("group-profile-setup");
    },
    5000,
  );

  await dismissLockScreenIfPresent();
  const provideTab = $("[data-testid='share-oobi-segment-button']");
  if (await provideTab.isExisting()) {
    await provideTab.click();
    await $(".share-profile-oobi").waitForExist({ timeout: 5000 });
  }
  console.log("[Bob] Camera dismissed, app can now receive group-active notifications");
});

// ---------------------------------------------------------------------------
// Step 6 (BACKEND) - All remote members complete the joining ceremony
// ---------------------------------------------------------------------------

When(/^all remote members complete the group joining process$/, async function () {
  const world = this as BobJoinerWorld;
  if (!world.remoteInitiator) {
    throw new Error("Remote initiator (Alice) is not set up.");
  }

  const groupName = world.bobGroupName ?? "MultisigGroup";

  for (const member of Object.values(world.extraVirtualMembers ?? {})) {
    await member.acceptGroupInvitation(60000, groupName);
  }

  await world.remoteInitiator.waitPendingOperations();
  for (const member of Object.values(world.extraVirtualMembers ?? {})) {
    await member.waitPendingOperations();
  }

  await world.remoteInitiator.authorizeGroupAgents(groupName);
  for (const member of Object.values(world.extraVirtualMembers ?? {})) {
    await member.authorizeGroupAgents(groupName);
  }

  await world.remoteInitiator.processIncomingGroupAgentsEndorcements(groupName);
  for (const member of Object.values(world.extraVirtualMembers ?? {})) {
    await member.processIncomingGroupAgentsEndorcements(groupName);
  }

  await world.remoteInitiator.waitPendingOperations();
  for (const member of Object.values(world.extraVirtualMembers ?? {})) {
    await member.waitPendingOperations();
  }
});

// ---------------------------------------------------------------------------
// Step 7 (ASSERT) - Group is Active for the joiner
// ---------------------------------------------------------------------------

Then(/^the group becomes "Active" for the joiner$/, async function () {
  const world = this as BobJoinerWorld;
  const groupName = world.bobGroupName ?? "MultisigGroup";

  // Lock screen can appear during Step 6 (backend join ceremony). Dismiss first.
  await dismissLockScreenIfPresent();

  // Wait for the app to navigate to home
  await waitUpTo(
    async () => {
      const url = await browser.getUrl();
      return url.includes("/tabs/home");
    },
    3000,
  );

  await assertGroupProfileActiveInProfilesList(groupName);
});
