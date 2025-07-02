import { expect } from "expect-webdriverio";

export class RecoverWalletScreen {
  get pageTitleText() {
    return $("[data-testid='verify-recovery-seed-phrase-title']");
  }

  get confirmButton() {
    return $("[data-testid='primary-button-verify-recovery-seed-phrase']");
  }

  get creatNewWalletButton() {
    return $("[data-testid='tertiary-button-verify-recovery-seed-phrase']");
  }

  async loads() {
    await expect(this.pageTitleText).toBeDisplayed();
    await expect(this.pageTitleText).toHaveText("Recover wallet");
    await expect(this.confirmButton).toBeDisplayed();
    await expect(this.creatNewWalletButton).toBeDisplayed();
  }
}

export default new RecoverWalletScreen();