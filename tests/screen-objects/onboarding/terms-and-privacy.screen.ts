import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";

export class TermsAndPrivacyScreen {
  get acceptButton() {
    // PageFooter button uses pageId in testid: primary-button-{pageId}
    // For TermsAndPrivacy, pageId is "terms-n-privacy-content"
    // Try multiple selectors for compatibility
    return $("ion-button[data-testid*='primary-button'], button[data-testid*='primary-button'], [data-testid*='primary-button']");
  }

  get termsTab() {
    return $("[data-testid='term-segment-button']");
  }

  get privacyTab() {
    return $("[data-testid='term-segment-button']");
  }

  async isDisplayed(): Promise<boolean> {
    return await this.acceptButton.isDisplayed().catch(() => false);
  }

  async loads() {
    await expect(this.acceptButton).toBeDisplayed();
  }

  async clickTermsTab() {
    // Find the segment button and click the first one (Terms)
    const buttons = await $$("[data-testid='term-segment-button']");
    const buttonCount = await buttons.length;
    if (buttonCount > 0) {
      await buttons[0].waitForClickable({ timeout: 5000 });
      await buttons[0].click();
    } else {
      throw new Error("Terms tab button not found");
    }
  }

  async clickPrivacyTab() {
    // Find the segment button and click the second one (Privacy)
    const buttons = await $$("[data-testid='term-segment-button']");
    const buttonCount = await buttons.length;
    if (buttonCount > 1) {
      await buttons[1].waitForClickable({ timeout: 5000 });
      await buttons[1].click();
    } else {
      throw new Error("Privacy tab button not found");
    }
  }

  async isTermsTabSelected(): Promise<boolean> {
    // Check if Terms tab is selected by checking the first segment button
    const buttons = await $$("[data-testid='term-segment-button']");
    const buttonCount = await buttons.length;
    if (buttonCount > 0) {
      const isSelected = await buttons[0].getAttribute("class");
      return (isSelected?.includes("segment-button-checked") || false);
    }
    return false;
  }

  async isPrivacyTabSelected(): Promise<boolean> {
    // Check if Privacy tab is selected by checking the second segment button
    const buttons = await $$("[data-testid='term-segment-button']");
    const buttonCount = await buttons.length;
    if (buttonCount > 1) {
      const isSelected = await buttons[1].getAttribute("class");
      return (isSelected?.includes("segment-button-checked") || false);
    }
    return false;
  }

  async acceptTerms() {
    // Ensure we're in the webview context for mobile apps
    try {
      const contexts = await browser.getContexts();
      if (contexts && contexts.length > 0) {
        const webviewContext = contexts.find((ctx) => {
          const ctxStr = typeof ctx === 'string' ? ctx : (ctx as any).id || String(ctx);
          return ctxStr.includes("WEBVIEW") || ctxStr.includes("webview");
        });
        if (webviewContext) {
          const currentContext = await browser.getContext();
          const webviewContextStr = typeof webviewContext === 'string' ? webviewContext : (webviewContext as any).id || String(webviewContext);
          if (currentContext !== webviewContextStr) {
            await browser.switchContext(webviewContextStr);
            await browser.pause(1000);
          }
        }
      }
    } catch (error) {
      // If context switching fails, continue (might be browser test)
    }
    
    // First ensure terms screen is fully loaded
    await this.loads();
    
    // Scroll to bottom to ensure button is visible (button is in footer at bottom)
    await browser.execute(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await browser.pause(500);
    
    // Try to find and click the button using JavaScript (most reliable for Ionic buttons)
    const clicked = await browser.execute(() => {
      // Try finding button by testid with pageId: primary-button-terms-n-privacy-content
      let button = document.querySelector("ion-button[data-testid='primary-button-terms-n-privacy-content']") as any;
      
      // Try without pageId
      if (!button) {
        button = document.querySelector("ion-button[data-testid='primary-button']") as any;
      }
      
      // Try any primary button
      if (!button) {
        button = document.querySelector("ion-button[data-testid*='primary-button']") as any;
      }
      
      // Try finding by text "I accept"
      if (!button) {
        const allButtons = document.querySelectorAll("ion-button, button");
        for (const btn of Array.from(allButtons)) {
          const text = (btn.textContent || '').toLowerCase().trim();
          if (text === 'i accept' || text.includes('accept')) {
            button = btn;
            break;
          }
        }
      }
      
      if (!button) {
        return false;
      }
      
      // Try multiple click methods
      // Method 1: Direct click
      if (button.click) {
        try {
          button.click();
          return true;
        } catch (e) {
          // Continue to other methods
        }
      }
      
      // Method 2: Shadow DOM button
      if (button.shadowRoot) {
        const shadowButton = button.shadowRoot.querySelector("button");
        if (shadowButton && (shadowButton as any).click) {
          try {
            (shadowButton as any).click();
            return true;
          } catch (e) {
            // Continue
          }
        }
      }
      
      // Method 3: Light DOM button
      const lightButton = button.querySelector("button");
      if (lightButton && (lightButton as any).click) {
        try {
          (lightButton as any).click();
          return true;
        } catch (e) {
          // Continue
        }
      }
      
      // Method 4: Dispatch click event
      try {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window
        });
        button.dispatchEvent(clickEvent);
        return true;
      } catch (e) {
        return false;
      }
    });
    
    if (!clicked) {
      // Fallback: Try WebdriverIO click
      try {
        await this.acceptButton.waitForClickable({ timeout: 5000 });
        await this.acceptButton.click();
      } catch (error) {
        throw new Error(`Failed to click Accept button. Error: ${error}`);
      }
    }
    
    // Wait for navigation to start
    await browser.pause(1000);
  }

  async acceptIfPresent() {
    if (await this.isDisplayed()) {
      await this.acceptTerms();
    }
  }
}

export default new TermsAndPrivacyScreen();
