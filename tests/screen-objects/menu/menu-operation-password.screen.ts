import { expect } from "expect-webdriverio";

export class MenuOperationPasswordScreen {
  get alertModalCancelButton() {
    return '[data-testid="alert-cancel-enable-password-cancel-button"]';
  }

  get alertModalConfirmButton() {
    return '[data-testid="alert-cancel-enable-password-confirm-button"]';
  }

  get alertModalConfirmButtonWebView() {
    return $('[data-testid="alert-cancel-confirm-button"]');
  }

  get backButton() {
    return $('[data-testid="back-button"]');
  }

  get operationPasswordButton() {
    return $('[data-testid="settings-item-toggle-password"] > ion-toggle');
  }

  get operationPasswordText() {
    return $('[data-testid="settings-item-toggle-password"]');
  }

  get managePasswordText() {
    return $('[data-testid="manage-password-title"]');
  }

  async tapOnBackButton() {
    await expect(this.backButton).toBeDisplayed();
    await expect(this.backButton).toBeEnabled();
    await this.backButton.click();
  }

  async tapOnAlertModalConfirmButton() {
    await expect(this.alertModalConfirmButtonWebView).toBeDisplayed();
    await expect(this.alertModalConfirmButtonWebView).toBeEnabled();
    await this.alertModalConfirmButtonWebView.click();
  }

  async tapOnOperationPasswordButton() {
    await expect(this.operationPasswordButton).toBeDisplayed();
    await expect(this.operationPasswordButton).toBeEnabled();
    await this.operationPasswordButton.click();
  }

  async getOperationPasswordButtonStatus(): Promise<boolean> {
    return (await this.operationPasswordButton.getProperty(
      "checked"
    )) as boolean;
  }

  async loads() {
    await expect(this.operationPasswordButton).toBeDisplayed();
    await expect(this.backButton).toBeDisplayed();
    await expect(this.operationPasswordText).toBeDisplayed();
    await expect(this.managePasswordText).toBeDisplayed();
  }
}

export default new MenuOperationPasswordScreen();
