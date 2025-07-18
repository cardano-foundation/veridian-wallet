import { expect } from "expect-webdriverio";
import {
  RecoveryPhrase,
  VerifyYourRecoveryPhrase,
  WrongVerifyYourRecoveryPhrase,
} from "../../constants/text.constants.js";
import { VerifyYourRecoveryPhraseScreen } from "../onboarding/verify-your-recovery-phrase.screen.js";

export class MenuRecoveryPhraseScreen {
  get backButton() {
    return $("[data-testid='back-button']");
  }

  get screenTitle() {
    return $('[data-testid="recovery-phrase-title"]');
  }

  get viewButton() {
    return $('[data-testid="primary-button-recovery-seed-phrase"]');
  }

  get hiddenStateOfRecoveryPhrase() {
    return $(
      `[data-testid="seed-phrase-module"][class="seed-phrase-module seed-phrase-hidden"]`
    );
  }

  get visibleStateOfRecoveryPhrase() {
    return $(
      `[data-testid="seed-phrase-module"][class="seed-phrase-module seed-phrase-visible"]`
    );
  }

  async loads() {
    await expect(this.backButton).toBeExisting();
    await expect(this.backButton).toBeDisplayed();
    await expect(this.screenTitle).toBeExisting();
    await expect(this.screenTitle).toBeDisplayed();
    await expect(this.screenTitle).toHaveText(RecoveryPhrase.Title);
    await expect(this.viewButton).toBeExisting();
    await expect(this.viewButton).toBeDisplayed();
  }

  async recoveryPhraseVisibility(state: string) {
    if (state === "see") {
      expect(this.visibleStateOfRecoveryPhrase).toBeDisplayed();
      expect(this.visibleStateOfRecoveryPhrase).toBeEnabled();
    } else {
      expect(this.hiddenStateOfRecoveryPhrase).toBeDisplayed();
      expect(this.hiddenStateOfRecoveryPhrase).toBeEnabled();
    }
  }
}

export default new MenuRecoveryPhraseScreen();
