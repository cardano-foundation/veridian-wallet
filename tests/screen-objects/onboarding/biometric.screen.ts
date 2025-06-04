import { expect } from "expect-webdriverio";
import { Biometric } from "../../constants/text.constants";

export class BiometricScreen {
  get cancelBiometricText() {
    return $("[data-testid='alert-cancel-biometry'] .alert-title.sc-ion-alert-md")
  }

  get okButton() {
    return $("[data-testid='alert-cancel-biometry-confirm-button']");
  }

  get biometricTitleText() {
    return $(".page-info > h1");
  }

  get biometricSubTitleText() {
    return $(".page-info > p");
  }

  get enableBiometricButton() {
    return $("[data-testid='primary-button']");
  }

  get setUpLaterButton() {
    return $("[data-testid='tertiary-button']");
  }

  async loads() {
    await expect(this.biometricTitleText).toBeDisplayed();
    await expect(this.biometricTitleText).toHaveText(Biometric.Title);
    await expect(this.biometricSubTitleText).toBeDisplayed();
    await expect(this.biometricSubTitleText).toHaveText(Biometric.SubTitle);
    await expect(this.enableBiometricButton).toBeExisting();
    await expect(this.setUpLaterButton).toBeExisting();
  }

  async cancelBiometricLoads() {
    await expect(this.biometricTitleText).not.toBeDisplayed();
    await expect(this.cancelBiometricText).toBeDisplayed();
    await expect(this.cancelBiometricText).toHaveText(Biometric.DescriptionCancelBiometric)
  }
}

export default new BiometricScreen();