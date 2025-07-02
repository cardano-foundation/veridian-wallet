import { expect } from "expect-webdriverio";
import { WelcomeBack } from "../../constants/text.constants";

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

  get loginUnavailableTitle() {
    return $("[data-testid='login-attempt-alert'] h2");
  }

  get loginUnavailableContent() {
    return $("[data-testid='alert-content']");
  }

  async loads() {
    expect(this.welcomeBackTitle).toBeDisplayed();
    expect(this.welcomeBackTitle).toHaveText(WelcomeBack.Title);
    expect(this.forgotPasscodeButton).toBeDisplayed();
  }

  async checkErrorMessage(message :string) {
    expect(this.errorMessage).toHaveText(message);
  }

  async checkLoginUnavailableScreen(title :string, content :string) {
    expect(this.loginUnavailableTitle).toBeDisplayed();
    expect(this.loginUnavailableTitle).toHaveText(title);
    expect(this.loginUnavailableContent).toBeDisplayed();
    expect(this.loginUnavailableContent).toHaveText(content);
  }

  async clickOnForgottenPasscodeButton() {
    if (await this.forgotPasscodeButton.isDisplayed()) {
      await this.forgotPasscodeButton.click();
    }
  }
}
export default new WelcomeBackScreen();