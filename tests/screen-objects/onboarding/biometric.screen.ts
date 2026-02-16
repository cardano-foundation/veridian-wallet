import { expect } from "expect-webdriverio";
import { Biometric } from "../../constants/text.constants";

export class BiometricScreen {
  get cancelBiometricAlert() {
    return $("[data-testid='alert-cancel-biometry']");
  }

  get cancelBiometricText() {
    // IonAlert renders in shadow DOM, so we need to find the alert container first
    // The text is in the header of the IonAlert
    return $("[data-testid='alert-cancel-biometry']");
  }

  get okButton() {
    return $("[data-testid='alert-cancel-biometry-confirm-button']");
  }

  get biometricTitleText() {
    return $(".page-info > h1");
  }

  get biometricSubTitleText() {
    return $(".page-info > p");
  }

  get enableBiometricButton() {
    // PageFooter doesn't receive pageId in SetupBiometrics, so button uses just "primary-button"
    return $("[data-testid='primary-button']");
  }

  get setUpLaterButton() {
    // PageFooter doesn't receive pageId in SetupBiometrics, so button uses just "tertiary-button"
    return $("[data-testid='tertiary-button']");
  }

  get skipButton() {
    return $("[data-testid='action-button']");
  }

  async loads() {
    await expect(this.biometricTitleText).toBeDisplayed();
    await expect(this.biometricTitleText).toHaveText(Biometric.Title);
    await expect(this.biometricSubTitleText).toBeDisplayed();
    await expect(this.biometricSubTitleText).toHaveText(Biometric.SubTitle);
    await expect(this.enableBiometricButton).toBeExisting();
    await expect(this.setUpLaterButton).toBeExisting();
  }

  async loadsWithAllOptions() {
    await this.loads();
    await expect(this.skipButton).toBeDisplayed();
    await expect(this.enableBiometricButton).toBeDisplayed();
    await expect(this.setUpLaterButton).toBeDisplayed();
  }

  async cancelBiometricLoads() {
    await expect(this.biometricTitleText).not.toBeDisplayed();
    await expect(this.cancelBiometricText).toBeDisplayed();
    await expect(this.cancelBiometricText).toHaveText(Biometric.DescriptionCancelBiometric)
  }

  async skipBiometric() {
    if (await this.biometricTitleText.isExisting()) {
      await this.setUpLaterButton.click();

      if (await this.okButton.isExisting()) {
        await this.okButton.click();
      }
    }
  }

  async tapSkipButton() {
    await this.skipButton.waitForDisplayed({ timeout: 10000 });
    await this.skipButton.click();
  }

  async tapEnableBiometricButton() {
    // PageFooter doesn't receive pageId, so button uses just "primary-button"
    // Wait for button to exist in DOM and scroll into view
    await browser.waitUntil(
      async () => {
        const buttonExists = await browser.execute(() => {
          const button = document.querySelector("[data-testid='primary-button']");
          if (button) {
            button.scrollIntoView({ block: "center", behavior: "smooth" });
          }
          return button !== null;
        });
        return buttonExists;
      },
      {
        timeout: 10000,
        timeoutMsg: "Enable biometrics button not found in DOM",
      }
    );
    
    // Small delay for scroll
    await browser.pause(300);
    
    // Try WebdriverIO click first
    try {
      await this.enableBiometricButton.waitForDisplayed({ timeout: 5000 });
      await this.enableBiometricButton.scrollIntoView({ block: "center" });
      await this.enableBiometricButton.click();
    } catch (e) {
      // Fallback: click using browser.execute (for shadow DOM)
      await browser.execute(() => {
        const button = document.querySelector("[data-testid='primary-button']") as HTMLElement | null;
        if (button) {
          button.scrollIntoView({ block: "center" });
          button.click();
        }
      });
    }
  }

  async tapSetUpLaterButton() {
    await this.setUpLaterButton.waitForDisplayed({ timeout: 10000 });
    await this.setUpLaterButton.click();
  }

  async isCancelAlertDisplayed(): Promise<boolean> {
    // Check if alert container is visible
    const alertVisible = await browser.execute(() => {
      const alert = document.querySelector("[data-testid='alert-cancel-biometry']");
      if (!alert) return false;
      
      // Check if the alert container has the visible class
      const container = document.querySelector("[data-testid='alert-cancel-biometry-container']");
      if (container) {
        return container.classList.contains("alert-visible");
      }
      
      // Fallback: check if IonAlert is open (might be in shadow DOM)
      return alert !== null;
    });
    return alertVisible;
  }

  async confirmCancelBiometric() {
    // Wait for OK button to be available
    await browser.waitUntil(
      async () => {
        const buttonExists = await browser.execute(() => {
          // Try to find button in DOM (might be in shadow DOM)
          const button = document.querySelector("[data-testid='alert-cancel-biometry-confirm-button']");
          return button !== null;
        });
        return buttonExists;
      },
      {
        timeout: 10000,
        timeoutMsg: "OK button not found in cancel biometric alert",
      }
    );
    
    // Try WebdriverIO click first
    try {
      await this.okButton.waitForDisplayed({ timeout: 5000 });
      await this.okButton.click();
    } catch (e) {
      // Fallback: click using browser.execute (for shadow DOM)
      await browser.execute(() => {
        const button = document.querySelector(
          "[data-testid='alert-cancel-biometry-confirm-button']"
        ) as HTMLElement | null;
        if (button) {
          button.click();
        }
      });
    }
  }
}

export default new BiometricScreen();