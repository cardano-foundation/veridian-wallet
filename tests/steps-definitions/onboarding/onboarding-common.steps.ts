import { Given } from "@wdio/cucumber-framework";
import { browser, driver } from "@wdio/globals";
import OnboardingScreen from "../../screen-objects/onboarding/onboarding.screen.js";

Given(/^user tap Get Started button on Onboarding screen$/, async function () {
  await OnboardingScreen.loads();
  await OnboardingScreen.tapOnGetStartedButton();
});

Given(/^the app is launched$/, async function () {
  try {
    // Wait for app to fully load
    await browser.pause(3000);
    
    // Switch to webview context (since autoWebview is disabled)
    const { switchToAppWebview } = await import("../../helpers/webview.helper.js");
    try {
      await switchToAppWebview();
    } catch (e) {
      // If webview not ready yet, try manual switch
      const contexts = await driver.getContexts();
      const webviewContext = contexts.find((ctx) => {
        const ctxStr = typeof ctx === 'string' ? ctx : ctx.id || String(ctx);
        return ctxStr.includes('WEBVIEW');
      });
      if (webviewContext) {
        const ctxStr = typeof webviewContext === 'string' ? webviewContext : webviewContext.id || String(webviewContext);
        await driver.switchContext(ctxStr);
        await browser.pause(1000);
      }
    }
    
    const currentUrl = await browser.getUrl();
    if (currentUrl.includes("http://") || currentUrl.includes("https://")) {
      if (!currentUrl.includes("localhost:3003")) {
        await browser.url("/");
        await browser.waitUntil(
          async () => {
            const url = await browser.getUrl();
            return url.includes("localhost:3003");
          },
          {
            timeout: 10000,
            timeoutMsg: "Failed to navigate to app URL",
          }
        );
      }
    }
    
    // Handle notification permission popup if it appears (Android native dialog)
    await dismissNotificationPermissionDialog();
  } catch (error) {
    await browser.pause(2000);
    // Try to dismiss notification dialog even if there was an error
    await dismissNotificationPermissionDialog().catch(() => {});
  }
});

/**
 * Dismisses the Android notification permission dialog if it appears
 * This is a native system dialog, so we need to use native context or ADB
 */
async function dismissNotificationPermissionDialog(): Promise<void> {
  try {
    // Wait a bit for the dialog to appear
    await browser.pause(1000);
    
    // Get all available contexts
    const contexts = await driver.getContexts();
    const nativeContext = contexts.find((ctx) => {
      const ctxStr = typeof ctx === 'string' ? ctx : ctx.id || String(ctx);
      return !ctxStr.includes('WEBVIEW');
    });
    
    if (nativeContext) {
      // Switch to native context to interact with system dialogs
      const nativeCtxStr = typeof nativeContext === 'string' ? nativeContext : nativeContext.id || String(nativeContext);
      await driver.switchContext(nativeCtxStr);
      
      try {
        // Look for notification permission dialog buttons
        // Common button texts: "Allow", "Don't allow", "Not now", "Deny"
        let allowButton = null;
        let dontAllowButton = null;
        try {
          allowButton = await $('//android.widget.Button[@text="Allow" or @text="ALLOW"]');
        } catch (e) {}
        try {
          dontAllowButton = await $('//android.widget.Button[@text="Don\'t allow" or @text="DON\'T ALLOW" or @text="Not now" or @text="Deny" or @text="DENY"]');
        } catch (e) {}
        
        // Try to find and click "Don't allow" first (to deny notifications)
        if (dontAllowButton && await dontAllowButton.isExisting().catch(() => false) && await dontAllowButton.isDisplayed().catch(() => false)) {
          await dontAllowButton.click();
          await browser.pause(500);
        } else if (allowButton && await allowButton.isExisting().catch(() => false) && await allowButton.isDisplayed().catch(() => false)) {
          // If only "Allow" is visible, we can click it or press back
          // For tests, we'll deny by pressing back button
          await driver.pressKeyCode(4); // Back button
          await browser.pause(500);
        }
      } catch (e) {
        // Dialog might not be present or already dismissed
      } finally {
        // Switch back to webview context
        const webviewContext = contexts.find((ctx) => {
          const ctxStr = typeof ctx === 'string' ? ctx : ctx.id || String(ctx);
          return ctxStr.includes('WEBVIEW');
        });
        if (webviewContext) {
          const webviewCtxStr = typeof webviewContext === 'string' ? webviewContext : webviewContext.id || String(webviewContext);
          await driver.switchContext(webviewCtxStr);
        }
      }
    }
  } catch (error) {
    // Non-blocking: if we can't dismiss the dialog, continue anyway
    // The test might still work if the dialog doesn't block interaction
  }
}