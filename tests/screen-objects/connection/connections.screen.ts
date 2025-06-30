import { expect } from "expect-webdriverio";
import { Connections } from "../../constants/text.constants";

export class ConnectionsScreen {
  get connectionButton() {
    return $("[data-testid='tab-title-credentials'] + ion-buttons");
  }

  get connectionTitleText() {
    return $("[data-testid='connections-title']");
  }

  get connectionCardPlaceholder() {
    return $("[data-testid='connections-cards-placeholder']");
  }

  get addConnectionButton() {
    return $("[data-testid='primary-button-connections']");
  }

  get plusButton() {
    return $("[data-testid='add-connection-button']");
  }

  get backButton() {
    return $("[data-testid='back-button']");
  }

  get addConnectionTitleText() {
    return $("[data-testid='add-a-connection-title']");
  }

  get doneButton() {
    return $("[data-testid='close-button']");
  }

  get scanQRButton() {
    return $("[data-testid='add-connection-modal-scan-qr-code']");
  }

  get provideQRButton() {
    return $("[data-testid='add-connection-modal-provide-qr-code']");
  }

  async checkConnectionsCard() {
    await expect(this.connectionTitleText).toBeDisplayed();
    await expect(this.connectionTitleText).toHaveText(Connections.Title);
    await expect(this.connectionCardPlaceholder).toBeDisplayed();
  }

  async checkAddConnectionModal() {
    await expect(this.addConnectionTitleText).toBeDisplayed();
    await expect(this.addConnectionTitleText).toHaveText(Connections.TitleModal);
    await expect(this.doneButton).toBeDisplayed();
    await expect(this.scanQRButton).toBeDisplayed();
    await expect(this.provideQRButton).toBeDisplayed();
  }
}

export default new ConnectionsScreen();