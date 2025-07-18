import { expect } from "expect-webdriverio";
import {
  VerifyYourRecoveryPhrase,
  WrongVerifyYourRecoveryPhrase,
} from "../../constants/text.constants.js";
import { VerifyYourRecoveryPhraseScreen } from "../onboarding/verify-your-recovery-phrase.screen.js";

export class MenuVerifyYourRecoveryPhraseScreen extends VerifyYourRecoveryPhraseScreen {
  get screenDescriptionText() {
    return $('[data-testid="forgot-auth-info-paragraph-top"]');
  }

  get screenTitle() {
    return $('[data-testid="forgot-passcode-title"]');
  }

  get verifyButton() {
    return $('[data-testid="primary-button-forgot-auth-info"]');
  }

  get cancelButton() {
    return $("[data-testid='forgot-auth-info-modal-page'] [data-testid='close-button']");
  }

  get popUpDescriptionText() {
    return $$('[class*="alert-title"]');
  }

  async loads() {
    await expect(this.screenTitle).toBeDisplayed();
    await expect(this.screenTitle).toHaveText(
      VerifyYourRecoveryPhrase.MenuTitle
    );
    await expect(this.screenDescriptionText).toBeExisting();
    await expect(this.screenDescriptionText).toHaveText(
      VerifyYourRecoveryPhrase.MenuDescription
    );
    await expect(this.verifyButton).toBeExisting();
    await expect(this.verifyButton).toBeDisplayed();
  }

  async wrongRecoveryPhrasePopupLoads() {
    const elements = await this.popUpDescriptionText;
    const lastElement = elements[(await elements.length) - 1];
    await expect(lastElement).toBeExisting();
    await expect(lastElement).toBeDisplayed();
    await expect(lastElement).toHaveText(
      WrongVerifyYourRecoveryPhrase.Description
    );
  }
}

export default new MenuVerifyYourRecoveryPhraseScreen();
