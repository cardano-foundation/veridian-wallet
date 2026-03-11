import { expect } from "expect-webdriverio";

export class OnboardingScreen {
  get getStartedButton() {
    return $("[data-testid=\"primary-button-onboarding\"]");
  }

  get iAlreadyHaveAWalletButton() {
    return $("[data-testid=\"tertiary-button-onboarding\"]");
  }

  async loads() {
    await this.getStartedButton.waitForDisplayed({ timeout: 2000 });
    await expect(this.getStartedButton).toBeDisplayed();
    await expect(this.iAlreadyHaveAWalletButton).toBeDisplayed();
  }

  async tapOnGetStartedButton() {
    await this.getStartedButton.waitForDisplayed({ timeout: 2000 });
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
