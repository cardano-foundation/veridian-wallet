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

  async loads() {
    await expect(this.pageTitleText).toBeDisplayed();
    await expect(this.pageTitleText).toHaveText("Before you switch");
    await expect(this.continueButton).toBeDisplayed();
  }

}

export default new SwitchRecoverWalletScreen();