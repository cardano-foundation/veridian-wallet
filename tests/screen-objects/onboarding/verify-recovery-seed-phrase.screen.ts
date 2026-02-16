import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";

export class VerifyRecoverySeedPhraseScreen {
  get screenTitle() {
    return $("[data-testid='verify-recovery-seed-phrase-title']");
  }

  get screenDescription() {
    return $("[data-testid='verify-recovery-seed-phrase-paragraph-top']");
  }

  get continueButton() {
    return $("[data-testid='primary-button-verify-recovery-seed-phrase']");
  }

  get wordInputs() {
    return $$("[data-testid^='word-input-']");
  }

  async loads() {
    await browser.waitUntil(
      async () => {
        return await this.screenTitle.isExisting().catch(() => false);
      },
      {
        timeout: 15000,
        timeoutMsg: "Verify Recovery Seed Phrase screen did not load",
      }
    );
    await expect(this.screenTitle).toBeDisplayed();
    await expect(this.screenDescription).toBeDisplayed();
  }
}

export default new VerifyRecoverySeedPhraseScreen();

