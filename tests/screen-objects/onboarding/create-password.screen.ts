import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";
import { CreatePassword } from "../../constants/text.constants.js";
import AlertModal from "../components/alert.modal.js";

export class CreatePasswordScreen {
  get alertModal() {
    return "[data-testid=\"create-password-alert-skip\"]";
  }

  get confirmPasswordInput() {
    return $("#confirm-password-input input");
  }

  get createPasswordButton() {
    return $("[data-testid=\"primary-button-create-password\"]");
  }

  get createPasswordInput() {
    return $("#create-password-input input");
  }

  get errorMessageText() {
    return $("[data-testid=\"error-message-text\"]");
  }

  get hintInput() {
    return $("#create-hint-input input");
  }

  get id() {
    return "[data-testid=\"create-password-page\"]";
  }

  get screenTitle() {
    return $("[data-testid=\"create-password-title\"]");
  }

  get screenTopParagraph() {
    return $("[data-testid=\"create-password-top-paragraph\"]");
  }

  get skipButton() {
    return $("[data-testid='action-button']");
  }

  get passwordAcceptCriteriaParagraph() {
    return $("[data-testid=\"password-accept-criteria\"]");
  }

  get pageInforTitle() {
    return $(".setup-password > .page-info");
  }

  get addPasswordButton() {
    return $(
      "[data-testid='primary-button-create-password'], [data-testid='primary-button']"
    );
  }

  get setUpLaterButton() {
    return $(
      "[data-testid='tertiary-button-create-password'], [data-testid='tertiary-button']"
    );
  }

  // Setup screen (step 0) elements
  get setupScreenTitle() {
    return $(".setup-password > .page-info > h1");
  }

  get setupScreenDescription() {
    return $(".setup-password > .page-info > p");
  }

  get padlockIcon() {
    return $(".setup-password > .page-info > ion-icon");
  }

  // Password creation screen (step 1) elements
  get symbolGuideLink() {
    return $("[data-testid='open-symbol-modal']");
  }

  get symbolModal() {
    return $("[data-testid='symbol-modal']");
  }

  get passwordStrengthMeter() {
    return $(".password-strength-meter");
  }

  get passwordStrengthLabel() {
    return $(".password-strength-meter > p");
  }

  get passwordEyeIcon() {
    return $("[data-testid='create-password-input-hide-btn']");
  }

  get confirmPasswordEyeIcon() {
    return $("[data-testid='confirm-password-input-hide-btn']");
  }

  get learnMoreLink() {
    return $(".learn-more");
  }

  get hintErrorMessageText() {
    // Hint error message is displayed using ErrorMessage component below the hint input
    return $("[data-testid='error-message-text']");
  }

  get hintErrorMessage() {
    // Alternative: find error message near hint input
    return $("[data-testid='error-message']");
  }

  /**
   * Tap the "Add a password" button with retries and JS fallback because
   * IonButton can occasionally ignore a plain click when shadow-wrapped.
   * After clicking, waits for the password form (step 1) to appear.
   */
  async tapAddPassword() {
    // Wait for page to be fully loaded and stable
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        return url.includes("createpassword");
      },
      {
        timeout: 15000,
        timeoutMsg: "Did not navigate to createpassword page",
      }
    );
    
    // Wait for the setup screen to be visible
    await this.pageInforTitle.waitForDisplayed({ timeout: 15000 });
    
    // Wait for page to be stable (no redirects happening)
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        const isOnCreatePassword = url.includes("createpassword");
        if (!isOnCreatePassword) {
          return false;
        }
        // Wait a bit and check again to ensure it's stable
        await browser.pause(200);
        const urlAgain = await browser.getUrl();
        return urlAgain === url && urlAgain.includes("createpassword");
      },
      {
        timeout: 10000,
        timeoutMsg: "Page is not stable on createpassword - it may be redirecting",
      }
    );
    
    // Check URL is still correct before trying to find button
    const currentUrl = await browser.getUrl();
    if (!currentUrl.includes("createpassword")) {
      throw new Error(`Page redirected away from createpassword to: ${currentUrl} before finding button`);
    }
    
    // Wait for button to exist in DOM using browser.execute (more reliable for shadow DOM)
    await browser.waitUntil(
      async () => {
        const buttonExists = await browser.execute(() => {
          const el = document.querySelector(
            "[data-testid='primary-button-create-password'], [data-testid='primary-button']"
          );
          return el !== null;
        });
        return buttonExists;
      },
      {
        timeout: 10000,
        timeoutMsg: "Add password button not found in DOM",
      }
    );
    
    // Store current URL before clicking
    const urlBeforeClick = await browser.getUrl();
    
    // Option 1: Try clicking by text content (Light DOM approach)
    // This is the most reliable as it clicks what the user sees
    try {
      const buttonByText = await $('ion-button*=Add a password');
      await buttonByText.waitForDisplayed({ timeout: 5000 });
      await buttonByText.scrollIntoView({ block: "center", inline: "center" });
      await buttonByText.click();
    } catch (e) {
      // Fallback: Click using browser.execute with Light DOM child or composed event
      await browser.execute(() => {
        const el = document.querySelector(
          "[data-testid='primary-button-create-password'], [data-testid='primary-button']"
        ) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ block: "center", inline: "center" });
          
          // Option 1a: Find and click Light DOM child (text/content React controls)
          let lightDOMChild: HTMLElement | null = null;
          for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child.nodeType === Node.ELEMENT_NODE) {
              lightDOMChild = child as HTMLElement;
              break;
            }
          }
          
          if (lightDOMChild && lightDOMChild.click) {
            lightDOMChild.click();
            return;
          }
          
          // Option 2: Dispatch a composed event that crosses Shadow DOM boundaries
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            composed: true // CRITICAL: Allows event to bubble out of Shadow DOM
          });
          el.dispatchEvent(clickEvent);
        }
      });
    }
    
    // Wait a moment for React state update
    await browser.pause(500);
    
    // Check if URL changed (should NOT change - only step should change)
    const urlAfterClick = await browser.getUrl();
    if (urlAfterClick !== urlBeforeClick) {
      throw new Error(
        `Page navigated from ${urlBeforeClick} to ${urlAfterClick} after clicking Add a password. ` +
        `This suggests the click triggered navigation instead of just updating React state.`
      );
    }

    // Wait for the setup screen to disappear (step 0 -> step 1 transition)
    await browser.waitUntil(
      async () => {
        const setupScreenExists = await browser.execute(() => {
          return document.querySelector(".setup-password > .page-info") === null;
        });
        return setupScreenExists;
      },
      {
        timeout: 10000,
        timeoutMsg: "Setup password screen did not disappear after clicking Add a password",
      }
    );

    // Wait for the password form to appear (step 1 - PasswordModule)
    await this.createPasswordInput.waitForDisplayed({ timeout: 10000 });
    await this.confirmPasswordInput.waitForDisplayed({ timeout: 10000 });
  }

  async tapSetUpLater() {
    await browser.waitUntil(
      async () =>
        await browser.execute(() =>
          document.querySelector(
            "[data-testid='tertiary-button-create-password'], [data-testid='tertiary-button']"
          )
        ),
      {
        timeout: 15000,
        timeoutMsg: "Set up later button not found in DOM",
      }
    );

    await browser.execute(() => {
      const el = document.querySelector(
        "[data-testid='tertiary-button-create-password'], [data-testid='tertiary-button']"
      ) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: "center", inline: "center" });
        el.click();
      }
    });
  }

  async loads() {
    await expect(this.screenTitle).toBeDisplayed();
    await expect(this.screenTitle).toHaveText(CreatePassword.Title);
    await expect(this.screenTopParagraph).toBeDisplayed();
    await expect(this.screenTopParagraph).toHaveText(
      CreatePassword.Description
    );
    await expect(this.createPasswordInput).toBeDisplayed();
    await expect(this.confirmPasswordInput).toBeDisplayed();
    await expect(this.hintInput).toBeDisplayed();
    await expect(this.createPasswordButton).toBeExisting();
    await expect(this.skipButton).toBeDisplayed();
  }

  async skipPassword() {
    if (await this.pageInforTitle.isExisting()) {
      // Use tapSetUpLater which uses JavaScript execution for reliable clicking
      await this.tapSetUpLater();
      
      // Wait for alert modal to appear and confirm
      await browser.waitUntil(
        async () => {
          const alertModal = $(`${this.alertModal} #confirm-alert-button`);
          return await alertModal.isExisting().catch(() => false);
        },
        {
          timeout: 5000,
          timeoutMsg: "Alert modal did not appear after clicking Set up later",
        }
      );
      
      await AlertModal.clickConfirmButtonOf(this.alertModal);
    }
  }

  // Setup screen methods
  async loadsSetupScreen() {
    await expect(this.pageInforTitle).toBeDisplayed();
    await expect(this.setupScreenTitle).toBeDisplayed();
    await expect(this.setupScreenDescription).toBeDisplayed();
    await expect(this.padlockIcon).toBeDisplayed();
  }

  // Password creation screen methods
  async loadsPasswordCreationScreen() {
    await expect(this.createPasswordInput).toBeDisplayed();
    await expect(this.confirmPasswordInput).toBeDisplayed();
    await expect(this.hintInput).toBeDisplayed();
    await expect(this.createPasswordButton).toBeExisting();
  }

  async isPasswordCriteriaVisible(): Promise<boolean> {
    return await this.passwordAcceptCriteriaParagraph.isDisplayed().catch(() => false);
  }

  async isPasswordStrengthVisible(): Promise<boolean> {
    return await this.passwordStrengthMeter.isDisplayed().catch(() => false);
  }

  async getPasswordStrength(): Promise<string> {
    await this.passwordStrengthLabel.waitForDisplayed({ timeout: 5000 });
    return await this.passwordStrengthLabel.getText();
  }

  async isCriteriaStruckOut(criteriaType: 'length' | 'lowercase' | 'uppercase' | 'number' | 'symbol'): Promise<boolean> {
    const criteria = await this.passwordAcceptCriteriaParagraph;
    const classAttribute = await criteria.getAttribute("class");
    
    switch (criteriaType) {
      case 'length':
        return classAttribute.includes("match-length");
      case 'lowercase':
        return classAttribute.includes("lowercase");
      case 'uppercase':
        return classAttribute.includes("uppercase");
      case 'number':
        return classAttribute.includes("has-number");
      case 'symbol':
        return classAttribute.includes("has-symbol");
      default:
        return false;
    }
  }

  async isPasswordVisible(): Promise<boolean> {
    const inputType = await browser.execute(() => {
      const input = document.querySelector("#create-password-input input") as HTMLInputElement | null;
      return input?.type || "password";
    });
    return inputType === "text";
  }

  async isConfirmPasswordVisible(): Promise<boolean> {
    const inputType = await browser.execute(() => {
      const input = document.querySelector("#confirm-password-input input") as HTMLInputElement | null;
      return input?.type || "password";
    });
    return inputType === "text";
  }

  async togglePasswordVisibility() {
    await this.passwordEyeIcon.waitForDisplayed({ timeout: 5000 });
    await this.passwordEyeIcon.click();
    await browser.pause(200); // Small delay for state update
  }

  async toggleConfirmPasswordVisibility() {
    await this.confirmPasswordEyeIcon.waitForDisplayed({ timeout: 5000 });
    await this.confirmPasswordEyeIcon.click();
    await browser.pause(200); // Small delay for state update
  }

  async openSymbolGuide() {
    await this.symbolGuideLink.waitForDisplayed({ timeout: 5000 });
    await this.symbolGuideLink.click();
    await browser.waitUntil(
      async () => {
        return await this.symbolModal.isDisplayed().catch(() => false);
      },
      {
        timeout: 5000,
        timeoutMsg: "Symbol guide modal did not open",
      }
    );
  }

  async closeSymbolGuide() {
    // SymbolModal uses IonModal with PageHeader that has a close button
    // The close button is in PageHeader with data-testid="close-button"
    // But it might be scoped to the modal, so try finding it within the modal context
    let closeButton;
    try {
      closeButton = await this.symbolModal.$("[data-testid='close-button']");
    } catch {
      closeButton = $("[data-testid='close-button']");
    }
    
    try {
      await closeButton.waitForDisplayed({ timeout: 5000 });
      await closeButton.scrollIntoView({ block: "center" });
      await closeButton.click();
    } catch {
      // Fallback: try clicking backdrop or using ESC key
      await browser.keys('Escape');
    }
    
    // Wait for modal to close - IonModal uses isOpen prop
    await browser.waitUntil(
      async () => {
        const isOpen = await browser.execute(() => {
          const modal = document.querySelector("[data-testid='symbol-modal']") as any;
          if (!modal) return false;
          // Check if IonModal isOpen prop is false
          // IonModal might still be in DOM but not visible
          const style = window.getComputedStyle(modal);
          const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
          return !isVisible;
        });
        return !isOpen;
      },
      {
        timeout: 5000,
        timeoutMsg: "Symbol guide modal did not close",
      }
    );
  }

  async isCreatePasswordButtonEnabled(): Promise<boolean> {
    // Check if button is disabled via attribute or class
    // IonButton uses shadow DOM, so we need to check the actual button element inside
    const buttonState = await browser.execute(() => {
      const ionButton = document.querySelector("[data-testid='primary-button-create-password']") as HTMLElement | null;
      if (!ionButton) return false;
      
      // IonButton has shadow DOM, check the actual button element inside
      const shadowRoot = ionButton.shadowRoot;
      if (shadowRoot) {
        const actualButton = shadowRoot.querySelector("button") as HTMLButtonElement | null;
        if (actualButton) {
          return !actualButton.disabled;
        }
      }
      
      // Fallback: check disabled attribute on ion-button itself
      const hasDisabledAttr = ionButton.hasAttribute("disabled");
      // Check if button has disabled class
      const hasDisabledClass = ionButton.classList.contains("button-disabled") || 
                               ionButton.classList.contains("disabled");
      // Check aria-disabled
      const ariaDisabled = ionButton.getAttribute("aria-disabled") === "true";
      
      return !hasDisabledAttr && !hasDisabledClass && !ariaDisabled;
    });
    return buttonState;
  }

  async enterPassword(password: string) {
    await this.createPasswordInput.waitForDisplayed({ timeout: 5000 });
    await this.createPasswordInput.setValue(password);
    // Wait for React state updates and validation to complete
    // PasswordModule recalculates validated -> onValidationChange -> CreatePassword updates validPassword -> button state updates
    await browser.pause(800); // Increased wait for React state propagation
  }

  async enterConfirmPassword(password: string) {
    await this.confirmPasswordInput.waitForDisplayed({ timeout: 5000 });
    await this.confirmPasswordInput.setValue(password);
    // Wait for React state updates and validation to complete
    await browser.pause(800); // Increased wait for React state propagation
  }

  async enterHint(hint: string) {
    await this.hintInput.waitForDisplayed({ timeout: 5000 });
    await this.hintInput.setValue(hint);
  }

  async clearForm() {
    // Clear password input
    await this.createPasswordInput.waitForDisplayed({ timeout: 5000 });
    await this.createPasswordInput.clearValue();
    
    // Clear confirm password input
    await this.confirmPasswordInput.waitForDisplayed({ timeout: 5000 });
    await this.confirmPasswordInput.clearValue();
    
    // Clear hint input
    await this.hintInput.waitForDisplayed({ timeout: 5000 });
    await this.hintInput.clearValue();
    
    // Wait for React state to update
    await browser.pause(500);
  }

  async tapCreatePasswordButton() {
    await browser.waitUntil(
      async () => {
        return await this.isCreatePasswordButtonEnabled();
      },
      {
        timeout: 10000,
        timeoutMsg: "Create password button is not enabled",
      }
    );
    await this.createPasswordButton.waitForDisplayed({ timeout: 5000 });
    
    // Use JavaScript-native click for Ionic button Shadow DOM compatibility
    await browser.execute((selector) => {
      const element = document.querySelector(selector) as HTMLElement | null;
      if (!element) {
        throw new Error(`Button not found: ${selector}`);
      }
      
      // Handle Ionic button shadow DOM
      const clickableElement = (element as any).shadowRoot?.querySelector('button') || element;
      
      // Force native JavaScript click
      clickableElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      (clickableElement as any).click();
    }, "[data-testid='primary-button-create-password'], [data-testid='primary-button']");
    
    await browser.pause(500); // Allow navigation/state update to start
  }
}

export default new CreatePasswordScreen();
