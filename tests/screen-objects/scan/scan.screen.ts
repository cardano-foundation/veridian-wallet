import { expect } from "expect-webdriverio";
import { ScanContent } from "../../constants/text.constants";
import { findAndClickLocator } from "../base.screen";

export class ScanScreen {
  get scanItem() {
    return $("[data-testid='tab-button-scan']");
  }

  get scannerText() {
    return $("span.qr-code-scanner-text");
  }

  get pasteButton() {
    return $("[data-testid='secondary-button-scanner']");
  }

  get pasteTextbox() {
    return $("[id*='ion-input']");
  }

  get confirmButton() {
    return ("//*[@data-testid='action-button']/following::p[text()='Confirm']");
  }

  get errorMessage() {
    return $("[data-testid='app-error-alert'] .alert-title.sc-ion-alert-ios");
  }

  get confirmAlertButton() {
    return $("[data-testid='app-error-alert-confirm-button']");
  }

  get connectionTitle() {
    return $("[data-testid='connections-title']");
  }

  get listConnection(): string[] {
    return ["[data-testid*='connection-group'] ion-item"];
  }

  get pendingIcon() {
    return $("[data-testid*='connection-group'] .md.ion-activatable");
  }

  get addedToast() {
    return $("[message='New connection added']");
  }

  async loads() {
    await expect(this.scannerText).toBeDisplayed();
    await expect(this.scannerText).toHaveText(ScanContent.ScannerText);
    await expect(this.pasteButton).toBeDisplayed();
  }

  async checkErrorMessage() {
    await expect(this.errorMessage).toBeDisplayed();
    await expect(this.errorMessage).toHaveText(ScanContent.ErrorMessage);
  }

  async inputToPasteContentTextbox(content: string) {
    await this.pasteButton.click();
    await this.pasteTextbox.setValue(content);
  }

  async clickConfirmButtonOf(locator: string) {
    await findAndClickLocator(`${locator}`);
  }

  async checkListConnection(length: number) {
    await expect(this.connectionTitle).toHaveText("Connections");
    await expect(this.listConnection).toHaveLength(length);
    await expect(this.pendingIcon).not.toBeDisplayed();
  }

  async checkToast() {
    if (await this.addedToast.getAttribute("message") == "New connection added") {
      await this.addedToast.waitForDisplayed({reverse: true});
    }
  }
}

export default new ScanScreen();
