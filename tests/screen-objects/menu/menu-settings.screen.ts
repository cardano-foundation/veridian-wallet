import { expect } from "expect-webdriverio";

export class MenuSettingsScreen {
  get appVersionItem() {
    return $('[data-testid="settings-item-7"]');
  }

  get biometricAuthenticationItem() {
    return $('[data-testid="settings-item-0"]');
  }

  get changePasscodeItem() {
    return $('[data-testid="settings-item-1"]');
  }

  get connectViaDiscordItem() {
    return $('[data-testid="settings-item-6"]');
  }

  get learnMoreItem() {
    return $('[data-testid="settings-item-4"]');
  }

  get manageOperationsPasswordItem() {
    return $('[data-testid="settings-item-2"]');
  }

  get recoveryPhraseItem() {
    return $('[data-testid="settings-item-3"]');
  }

  get termsAndPrivacyPolicyItem() {
    return $('[data-testid="settings-item-5"]');
  }

  async loads() {
    if (await this.biometricAuthenticationItem.isExisting()) {
      await expect(this.biometricAuthenticationItem).toBeDisplayed();
    }
    await expect(this.changePasscodeItem).toBeDisplayed();
    await expect(this.manageOperationsPasswordItem).toBeDisplayed();
    await expect(this.recoveryPhraseItem).toBeDisplayed();
    await expect(this.learnMoreItem).toBeDisplayed();
    await expect(this.termsAndPrivacyPolicyItem).toBeDisplayed();
    await expect(this.connectViaDiscordItem).toBeDisplayed();
    await expect(this.appVersionItem).toBeDisplayed();
  }

  async tapOnChangePasscodeButton() {
    await expect(this.changePasscodeItem).toBeDisplayed();
    await expect(this.changePasscodeItem).toBeEnabled();
    await this.changePasscodeItem.click();
  }

  async tapOnOperationPasswordButton() {
    await expect(this.manageOperationsPasswordItem).toBeDisplayed();
    await expect(this.manageOperationsPasswordItem).toBeEnabled();
    await this.manageOperationsPasswordItem.click();
  }

  async checkAppVersionIsDisplayed() {
    await expect(this.appVersionItem).toBeDisplayed();
  }

  async tapOnRecoveryPhraseButton() {
    await expect(this.recoveryPhraseItem).toBeDisplayed();
    await expect(this.recoveryPhraseItem).toBeEnabled();
    await this.recoveryPhraseItem.click();
  }
}

export default new MenuSettingsScreen();
