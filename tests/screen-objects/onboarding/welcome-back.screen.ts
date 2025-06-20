import { expect } from "expect-webdriverio";

export class WelcomeBackScreen {
  get welcomeBackTitle() {
    return $("[data-testid='lock-page-title']");
  }

  get forgotPasscodeButton() {
    return $("[data-testid='secondary-button-lock-page']");
  }

  get errorMessage() {
    return $("[data-testid='error-message-text']");
  }

  async loads() {
    expect(this.welcomeBackTitle).toBeDisplayed();
    expect(this.welcomeBackTitle).toHaveText("Welcome back");
    expect(this.forgotPasscodeButton).toBeDisplayed();
  }

  async checkErrorMessage(message :string) {
    expect(this.errorMessage).toHaveText(message);
  }
}
export default new WelcomeBackScreen();