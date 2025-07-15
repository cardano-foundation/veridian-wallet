import { expect } from "expect-webdriverio";

export class SwitchRecoverWalletScreen {
  get pageTitleText() {
    return $("[data-testid='before-you-switch-title']");
  }
  get confirmCheckbox() {
    return $("[data-testid='confirm-checkbox']");
  }

  get continueButton() {
    return $("[data-testid='primary-button-switch-modal']");
  }

  get backButton() {
    return $("[data-testid='close-button-label']");
  }

  async loads() {
    await expect(this.pageTitleText).toBeDisplayed();
    await expect(this.pageTitleText).toHaveText("Before you switch");
    await expect(this.continueButton).toBeDisplayed();
    await expect(this.backButton).toBeDisplayed();
  }

}

export default new SwitchRecoverWalletScreen();