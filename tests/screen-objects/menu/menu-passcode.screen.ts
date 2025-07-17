import { expect } from "expect-webdriverio";
import { PasscodeScreen } from "../onboarding/passcode.screen";
import { Passcode } from "../../constants/text.constants";

export class MenuPasscodeScreen extends PasscodeScreen {
  get cancelButton() {
    return $("[data-testid='verify-passcode-content-page'] [data-testid='close-button']");
  }

  get cancelButtonOnModal() {
    return '[data-testid="alert-forgotten-cancel-button"]';
  }

  get verifyYourRecoveryButton() {
    return '[data-testid="alert-forgotten-confirm-button"]';
  }

  get changePinTitle() {
    return $('[data-testid="change-pin-title"]');
  }

  get cantRememberButton() {
    return $('[data-testid="secondary-button-change-pin"]');
  }

  get forgottenPasswordButton() {
    return $('[data-testid="secondary-button-verify-passcode"]');
  }

  get verifyPasscodeTitle() {
    return $('[data-testid="verify-passcode-title"]');
  }

  get screenDescriptionText() {
    return $('[data-testid="verify-passcode-description"]');
  }

  get setPasscodeDescriptionText() {
    return $("[data-testid='set-passcode-description']");
  }

  async tapOnCancelButton() {
    await expect(this.cancelButton).toBeDisplayed();
    await expect(this.cancelButton).toBeEnabled();
    await this.cancelButton.click();
  }

  async tapOnForgottenPasswordButton() {
    await expect(this.forgottenPasswordButton).toBeDisplayed();
    await expect(this.forgottenPasswordButton).toBeEnabled();
    await this.forgottenPasswordButton.click();
  }

  async loadsOnEnterPasscodeScreen() {
    await expect(this.verifyPasscodeTitle).toBeDisplayed();
    await expect(this.verifyPasscodeTitle).toHaveText(
      Passcode.TitleEnterPasscode
    );
    await expect(this.screenDescriptionText).toBeDisplayed();
    await expect(this.screenDescriptionText).toHaveText(
      Passcode.DescriptionEnterPasscode
    );
    for (let i = 0; i < 10; i++) {
      await expect(await this.digitButton(i)).toBeDisplayed();
    }
  }

  async loads() {
    await expect(this.changePinTitle).toBeDisplayed();
    await expect(this.changePinTitle).toHaveText(Passcode.TitleNewPasscode);
    await expect(this.setPasscodeDescriptionText).toBeDisplayed();
    await expect(this.setPasscodeDescriptionText).toHaveText(
      Passcode.DescriptionNewPasscode
    );
    for (let i = 0; i < 10; i++) {
      await expect(await this.digitButton(i)).toBeDisplayed();
    }
  }
}

export default new MenuPasscodeScreen();
