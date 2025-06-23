import { expect } from "expect-webdriverio";
import { SsiAgentDetails } from "../../constants/text.constants.js";

export class SsiAgentDetailsScreen {
  get bootUrlInput() {
    return $("#boot-url-input input");
  }

  get connectUrlInput() {
    return $("#connect-url-input input");
  }

  get screenTitle() {
    return $("[data-testid=\"create-ssi-agent-title\"]");
  }

  get screenTopParagraph() {
    return $("[data-testid=\"create-ssi-agent-top-paragraph\"]");
  }

  get switchToRecoveryWalletButton() {
    return $("[data-testid=\"tertiary-button-create-ssi-agent\"]");
  }

  get validateButton() {
    return $("[data-testid=\"primary-button-create-ssi-agent\"]");
  }

  get bootUrlInputText() {
    return $("#boot-url-input");
  }

  get connectUrlInputText() {
    return $("#connect-url-input");
  }

  async tapOnValidatedButton() {
    await expect(this.validateButton).toBeDisplayed();
    await expect(this.validateButton).toBeEnabled();
    await this.validateButton.click();
  }

  async loads() {
    await expect(this.screenTitle).toBeDisplayed();
    await expect(this.screenTitle).toHaveText(SsiAgentDetails.Title);
    await expect(this.screenTopParagraph).toBeDisplayed();
    await expect(this.screenTopParagraph).toHaveText(
      SsiAgentDetails.DescriptionTop
    );
    await expect(this.bootUrlInput).toBeDisplayed();
    await expect(this.connectUrlInput).toBeDisplayed();
    await expect(this.validateButton).toBeDisplayed();
    await expect(this.switchToRecoveryWalletButton).toBeDisplayed();
  }
}

export default new SsiAgentDetailsScreen();
