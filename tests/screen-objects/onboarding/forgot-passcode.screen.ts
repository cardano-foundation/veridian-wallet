import { expect } from "expect-webdriverio";
import { ForgotPasscode } from "../../constants/text.constants";

export class ForgotPasscodeScreen {
  get forgotPopupContentText() {
    return $("[data-testid='alert-forgotten'] h2");
  }

  get verifyRecoveryPhraseButton() {
    return $("[data-testid='alert-forgotten-confirm-button']")
  }

  get cancelButton() {
    return $("[data-testid='alert-forgotten-cancel-button']");
  }

  get forgotPasscodeTitle() {
    return $("[data-testid='forgot-passcode-title']");
  }

  get forgotPasscodeContentText() {
    return $("[data-testid='forgot-auth-info-paragraph-top']");
  }

  async checkForgotPasscodePopup() {
    expect(this.forgotPopupContentText).toBeDisplayed();
    expect(this.forgotPopupContentText).toHaveText(ForgotPasscode.DescriptionPopup);
    expect(this.verifyRecoveryPhraseButton).toBeDisplayed();
    expect(this.cancelButton).toBeDisplayed()
  }

  async checkForgotPasscodeScreen() {
    expect(this.forgotPasscodeTitle).toBeDisplayed();
    expect(this.forgotPasscodeTitle).toHaveText(ForgotPasscode.Title);
    expect(this.forgotPasscodeContentText).toBeDisplayed();
    expect(this.forgotPasscodeContentText).toHaveText(ForgotPasscode.Description);
  }
}

export default new ForgotPasscodeScreen();