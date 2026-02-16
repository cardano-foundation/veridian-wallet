import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";
import { SSIAgent, SsiAgentDetails } from "../../constants/text.constants.js";

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

  get getInformationButton() {
    return $("[class*='copy-button']");
  }

  get aboutSSITitleText() {
    return $("[data-testid='about-ssi-agent-title']");
  }

  get doneButton() {
    return $("[data-testid='close-button']");
  }

  get onboardingDocumentationButton() {
    return $("[data-testid='open-ssi-documentation-button']");
  }

  get connectButton() {
    return $("[data-testid='primary-button-create-ssi-agent']");
  }

  get cancelButton() {
    return $("[data-testid='create-ssi-agent'] [data-testid='close-button']");
  }

  get bootUrlError() {
    // Error message appears below the boot URL input (sibling element)
    return $("[data-testid='error-message-text']");
  }

  get connectUrlError() {
    // Error message appears below the connect URL input (sibling element)
    return $("[data-testid='error-message-text']");
  }

  get bootUrlInputContainer() {
    return $("#boot-url-input");
  }

  get connectUrlInputContainer() {
    return $("#connect-url-input");
  }

  async clearBootUrl() {
    await this.bootUrlInput.waitForDisplayed();
    await this.bootUrlInput.clearValue();
  }

  async clearConnectUrl() {
    await this.connectUrlInput.waitForDisplayed();
    await this.connectUrlInput.clearValue();
  }

  async clearBothUrls() {
    await this.clearBootUrl();
    await this.clearConnectUrl();
  }

  async tapOnValidatedButton() {
    await expect(this.validateButton).toBeDisplayed();
    await expect(this.validateButton).toBeEnabled();
    await this.validateButton.click();
  }

  async enterBootUrl(url: string) {
    await this.bootUrlInput.waitForDisplayed();
    await this.bootUrlInput.click();
    await this.bootUrlInput.clearValue();
    await this.bootUrlInput.setValue(url);
  }

  async enterConnectUrl(url: string) {
    await this.connectUrlInput.waitForDisplayed();
    await this.connectUrlInput.click();
    await this.connectUrlInput.clearValue();
    await this.connectUrlInput.setValue(url);
  }

  async isConnectButtonEnabled(): Promise<boolean> {
    const button = await this.connectButton;
    const disabled = await button.getAttribute("disabled");
    return disabled === null;
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

  async checkAboutSSIAgentScreen() {
    await expect(this.aboutSSITitleText).toBeDisplayed();
    await expect(this.aboutSSITitleText).toHaveText(SSIAgent.TitleAboutSSIAgent);
    await expect(this.doneButton).toBeDisplayed();
  }
}

export default new SsiAgentDetailsScreen();
