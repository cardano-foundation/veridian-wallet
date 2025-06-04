import { expect } from "expect-webdriverio";
import { WelcomeMessage } from "../../constants/text.constants";

export class WelcomeMessageScreen {

  get welcomeBoard() {
    return $(".content");
  }
  get titleText() {
    return $(".content > h2");
  }

  get welcomeText() {
    return $(".content > p");
  }

  get addIdentifierButton() {
    return $("[data-testid='primary-button-welcome']");
  }

  get skipButton() {
    return $("[data-testid='action-button']");
  }

  get pendingToastMessage() {
    return $("[message='Identifier pending']");
  }

  get createdToastMessage() {
    return $("[message='Identifier created']");
  }

  async loads(titleName: string) {
    if (expect(this.welcomeBoard).toBeDisplayed()) {
      await expect(this.titleText).toBeDisplayed();
      await expect(this.titleText).toHaveText(titleName);
      await expect(this.welcomeText).toBeDisplayed();
      await expect(this.welcomeText).toHaveText(WelcomeMessage.Description)
      await expect(this.skipButton).toBeDisplayed();
    }
  }

  async welcomeScreenInvisible() {
    await expect(this.titleText).not.toBeDisplayed();
    await expect(this.welcomeText).not.toBeDisplayed();
    await expect(this.skipButton).not.toBeDisplayed();
  }

  async pendingToast() {
    if (await this.pendingToastMessage.isDisplayed()) {
      await expect(this.createdToastMessage.getAttribute("message")).toHaveText("Identifier pending");
      await this.pendingToastMessage.waitForDisplayed({ reverse: true });
    }
  }

  async createdToast() {
    if (await this.createdToastMessage.isDisplayed()) {
      await expect(this.createdToastMessage.getAttribute("message")).toHaveText("Identifier created");
      await this.createdToastMessage.waitForDisplayed({ reverse: true });
    }
  }

  async handleSkipWelcomeScreen() {
    if (await this.skipButton.isExisting()) {
      await this.skipButton.click();
    }
  }
}


export default new WelcomeMessageScreen();