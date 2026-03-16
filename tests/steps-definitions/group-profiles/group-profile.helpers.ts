import { browser } from "@wdio/globals";

export async function pageContainsText(msg: string): Promise<boolean> {
  return (await browser.execute((m: string) => {
    const bodyText = document.body?.innerText ?? "";
    return bodyText.includes(m);
  }, msg)) as boolean;
}

export async function toastContainsText(msg: string): Promise<boolean> {
  try {
    return await browser.waitUntil(async () => {
      return await browser.execute((expectedMsg) => {
        const toasts = document.querySelectorAll("ion-toast");

        for (const toast of toasts) {
          const root = toast.shadowRoot || toast;
          const messageEl = root.querySelector(".toast-message, [part='message']");

          if (messageEl && messageEl.textContent) {
            if (messageEl.textContent.trim().includes(expectedMsg)) return true;
          }
        }
        return false;
      }, msg);
    }, {
      timeout: 100,
      interval: 20,
    });
  } catch {
    return false;
  }
}

export async function dismissLockScreenIfPresent(): Promise<void> {
  const lockPage = $("[data-testid='tertiary-button-lock-page']");
  if (await lockPage.isExisting().catch(() => false)) {
    await browser.execute(() => {
      const btn = document.querySelector(
        "[data-testid='tertiary-button-lock-page']"
      ) as HTMLElement | null;
      if (btn) btn.click();
    });
    await browser.waitUntil(
      async () =>
        !(await $("[data-testid='tertiary-button-lock-page']").isExisting().catch(() => false)),
      { timeout: 5000, interval: 200 }
    );
  }
}

export async function waitUpTo(
  condition: () => Promise<boolean>,
  timeout: number = 1500,
  interval: number = 150
): Promise<void> {
  await browser.waitUntil(condition, {
    timeout,
    interval,
    timeoutMsg: `Condition not met within ${timeout}ms`,
  });
}

export async function getPendingGroupPrimaryButtonText(): Promise<string> {
  return (
    ((await browser.execute(() => {
      const btn = document.querySelector(
        "[data-testid='primary-button-pending-group']"
      ) as HTMLElement | null;
      return btn?.innerText?.trim() ?? btn?.textContent?.trim() ?? "";
    })) as string) || ""
  );
}

export async function getLatestToastMessage(): Promise<string> {
  return (
    ((await browser.execute(() => {
      const toasts = Array.from(document.querySelectorAll("ion-toast"));
      for (const toast of toasts.reverse()) {
        const root = (toast as HTMLElement).shadowRoot;
        if (!root) continue;
        const messageEl =
          root.querySelector(".toast-message") ??
          root.querySelector("[part='message']");
        const text = messageEl?.textContent?.trim() ?? "";
        if (text) return text;
      }
      return "";
    })) as string) || ""
  );
}

export async function getConnectedMembersProgressText(): Promise<string> {
  return (
    ((await browser.execute(() => {
      const bodyText = document.body?.innerText ?? "";
      const match = bodyText.match(/\d+\s+out of\s+\d+\s+connected members/i);
      return match?.[0] ?? "";
    })) as string) || ""
  );
}

export async function pasteOobiAndConfirm(oobi: string, useJsClick = false): Promise<void> {
  const pasteButton = $("[data-testid='paste-content-button']");
  await pasteButton.waitForDisplayed();
  await pasteButton.scrollIntoView?.().catch(() => { });
  if (useJsClick) {
    await browser.execute(() => {
      const btn = document.querySelector("[data-testid='paste-content-button']");
      if (btn) (btn as HTMLElement).click();
    });
  } else {
    await pasteButton.click();
  }

  const scanInput = $("[data-testid='scan-input']");
  await scanInput.waitForDisplayed();
  const nativeInput = await scanInput.shadow$("input");
  await nativeInput.setValue(oobi);
  const confirmBtn = $("[data-testid='scan-input-modal'] [data-testid='action-button']");
  await confirmBtn.waitForDisplayed();
  await confirmBtn.click();
  await $("[data-testid='scan-input-modal']").waitForExist({ reverse: true, timeout: 5000 });
}

export async function assertGroupProfileActiveInProfilesList(displayName: string): Promise<void> {
  const avatarBtn = $("[data-testid='avatar-button']");
  await avatarBtn.waitForDisplayed();
  await browser.execute((sel: string) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) el.click();
  }, "[data-testid='avatar-button']");
  await waitUpTo(
    async () =>
      (await browser.execute(() => {
        const root = document.querySelector("[data-testid='profiles']");
        return (
          !!root &&
          root.querySelectorAll("[data-testid^='profiles-list-item-']").length > 0
        );
      })) as boolean
  );

  const result = await browser.execute(
    (name: string) => {
      const want = (name || "").trim().toLowerCase();
      const root = document.querySelector("[data-testid='profiles']");
      if (!root)
        return {
          active: false,
          reason: "profiles panel not found",
          profileId: null as string | null,
        };
      const items = root.querySelectorAll("[data-testid^='profiles-list-item-']");
      for (const item of items) {
        const nameEl = item.querySelector(".profiles-list-item-name");
        const currentName = (nameEl?.textContent?.trim() ?? "").toLowerCase();
        if (currentName !== want) continue;
        const testId = item.getAttribute("data-testid") ?? "";
        const id = testId.replace(/^profiles-list-item-/, "");
        const hasPending = !!item.querySelector(`[data-testid='profiles-list-item-pending-${id}-status']`);
        const hasAction = !!item.querySelector(`[data-testid='profiles-list-item-action-${id}-status']`);
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
      `Group profile "${displayName}" is not active in Profiles list (reason: ${result?.reason ?? "unknown"}).`
    );
  }
  if (result?.profileId) {
    const listItemSelector = `[data-testid='profiles-list-item-${result.profileId}']`;
    await $(listItemSelector).waitForDisplayed();
    await browser.execute((sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el) el.click();
    }, listItemSelector);
    await waitUpTo(
      () => $("[data-testid='profiles-option-button-manage profile']").isDisplayed().catch(() => false)
    );
  }
  const manageProfileSelector = "[data-testid='profiles-option-button-manage profile']";
  await $(manageProfileSelector).waitForDisplayed();
  await browser.execute((sel: string) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) el.click();
  }, manageProfileSelector);
}

export function extractAidFromOobi(oobiUrl: string): string {
  const url = new URL(oobiUrl);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const oobiIdx = pathParts.indexOf("oobi");
  if (oobiIdx === -1 || oobiIdx >= pathParts.length - 1) {
    throw new Error(`Cannot extract AID from OOBI URL: ${oobiUrl}`);
  }
  return pathParts[oobiIdx + 1];
}

export function normalizeOobiHostname(oobiUrl: string, targetConnectUrl: string): string {
  const u = new URL(oobiUrl);
  u.hostname = new URL(targetConnectUrl).hostname;
  return u.toString();
}

/*
  This function injects a script that captures the shared OOBI URL when the Share plugin is used.
*/
export async function installShareCapture() {
  const shareCaptureScript = `
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

  await browser.execute(shareCaptureScript);
}