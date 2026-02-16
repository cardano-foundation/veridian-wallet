import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";

export class ConnectToVeridianScreen {
  get title() {
    return $("[data-testid='connect-to-veridian-title']");
  }

  get getConnectedButton() {
    // The Connect component uses pageId "ssi-agent-summary"
    // So the button testid is "primary-button-ssi-agent-summary"
    return $("[data-testid='primary-button-ssi-agent-summary']");
  }

  get recoverWalletButton() {
    return $("[data-testid='tertiary-button-connect-to-veridian']");
  }

  async loads(): Promise<void> {
    await browser.waitUntil(
      async () => {
        return await this.getConnectedButton.isDisplayed().catch(() => false);
      },
      {
        timeout: 15000,
        timeoutMsg: "Connect to Veridian screen did not appear",
      }
    );
  }
}

export default new ConnectToVeridianScreen();
