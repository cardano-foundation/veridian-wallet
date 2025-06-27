import { expect } from "expect-webdriverio";

export class ConnectionsScreen {
  get connectionButton() {
    return $("[data-testid='connections-button']");
  }

  get connectionTitleText() {
    return $("[data-testid='connections-title']");
  }

  get listConnection(): string[] {
    return ["[data-testid*='connection-group'] ion-item"];
  }

  get backButton() {
    return $("[data-testid='back-button']");
  }

  get pendingIcon() {
    return $("[data-testid*='connection-group'] .md.ion-activatable");
  }

  async checkListConnection(length: number) {
    await expect(this.connectionTitleText).toHaveText("Connections");
    await expect(this.listConnection).toHaveLength(length);
    await expect(this.pendingIcon).not.toBeDisplayed();
  }
}

export default new ConnectionsScreen();