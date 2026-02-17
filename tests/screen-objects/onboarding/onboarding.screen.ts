import { expect } from "expect-webdriverio";

export class OnboardingScreen {
  get getStartedButton() {
    return $("[data-testid=\"primary-button-onboarding\"]");
  }

  get iAlreadyHaveAWalletButton() {
    return $("[data-testid=\"tertiary-button-onboarding\"]");
  }

  async loads(timeoutMs = 30000) {
    await this.getStartedButton.waitForDisplayed({ timeout: timeoutMs });
    await this.iAlreadyHaveAWalletButton.waitForDisplayed({ timeout: timeoutMs });
  }

  async tapOnGetStartedButton() {
    await expect(this.getStartedButton).toBeDisplayed();
    await expect(this.getStartedButton).toBeEnabled();
    await this.getStartedButton.click();
  }

  async tapOnIAlreadyHaveAWalletButton() {
    await expect(this.iAlreadyHaveAWalletButton).toBeDisplayed();
    await expect(this.iAlreadyHaveAWalletButton).toBeEnabled();
    await this.iAlreadyHaveAWalletButton.click();
  }
}

export default new OnboardingScreen();
