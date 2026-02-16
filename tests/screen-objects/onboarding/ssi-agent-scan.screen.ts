import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";

export class SsiAgentScanScreen {
  get cancelButton() {
    // Cancel button is in PageHeader, need to find it via the page structure
    return $("[data-testid='ssi-agent-scan']").$("[data-testid='close-button']");
  }

  get enterManualButton() {
    return $("[data-testid='primary-button-ssi-agent-scan']");
  }

  get advancedSetupButton() {
    // Try specific ID first (with pageId), then fallback to generic ID (without pageId)
    // This handles both cases: when pageId is passed and when it's not
    return $(
      "[data-testid='tertiary-button-ssi-agent-scan'], [data-testid='tertiary-button']"
    );
  }

  get scanContainer() {
    // Support both selectors - the page ID and the scan container
    // Step definitions use [data-testid="ssi-agent-scan-page"] for checking page existence
    return $("[data-testid='ssi-agent-scan-page']");
  }

  async isDisplayed(): Promise<boolean> {
    return await this.scanContainer.isDisplayed().catch(() => false);
  }

  async loads() {
    await expect(this.scanContainer).toBeDisplayed();
    await expect(this.enterManualButton).toBeDisplayed();
  }

  async clickAdvancedSetup() {
    // Switch to webview context (switchToAppWebview already has fallback logic)
    const { switchToAppWebview } = await import("../../helpers/webview.helper.js");
    await switchToAppWebview();
    
    // Wait for element to exist in DOM
    await this.advancedSetupButton.waitForExist({ timeout: 15000 });
    
    // JavaScript-native click with Shadow DOM piercing (bypasses WebdriverIO visibility checks)
    await browser.execute((sel) => {
      // Try both selectors (with and without pageId)
      const selectors = sel.split(',').map(s => s.trim());
      let element: HTMLElement | null = null;
      
      for (const singleSel of selectors) {
        element = document.querySelector(singleSel) as HTMLElement | null;
        if (element) break;
      }
      
      if (!element) return;
      
      element.scrollIntoView({ block: "center", behavior: "smooth" });
      
      // Handle Ionic button shadow DOM
      const clickableElement = (element as any).shadowRoot?.querySelector('button') || element;
      
      // Force native JavaScript click
      clickableElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      (clickableElement as any).click();
    }, "[data-testid='tertiary-button-ssi-agent-scan'], [data-testid='tertiary-button']");
    
    await browser.pause(500); // Allow navigation to start
  }

  /**
   * Dismisses the camera mode dialog if it appears (Android emulator dialog)
   */
  async dismissCameraModeDialog(): Promise<void> {
    try {
      await browser.execute(() => {
        const bodyText = document.body.textContent?.toLowerCase() || '';
        if (!bodyText.includes('camera mode')) return;

        // Click "Don't remind" checkbox if present
        const checkbox = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]')).find(
          (el) => (el.textContent || '').toLowerCase().includes("don't remind")
        ) as HTMLElement | undefined;
        checkbox?.click();

        // Find and click "Got It" button
        const gotItButton = Array.from(document.querySelectorAll('button, [role="button"], ion-button')).find(
          (btn) => (btn.textContent || '').toLowerCase().trim() === 'got it'
        ) as HTMLElement | undefined;

        if (gotItButton) {
          const clickable = (gotItButton as any).shadowRoot?.querySelector('button') || gotItButton;
          clickable.click();
        }
      });
      await browser.pause(200);
    } catch (error) {
      // Non-blocking: continue if dialog handling fails
    }
  }
}

export default new SsiAgentScanScreen();
