import { expect } from "expect-webdriverio";
import { CreatePassword } from "../../constants/text.constants.js";

export class CreatePasswordScreen {
  get alertModal() {
    return "[data-testid=\"create-password-alert-skip\"]";
  }

  get confirmPasswordInput() {
    return $("#confirm-password-input input");
  }

  get createPasswordButton() {
    return $("[data-testid=\"primary-button-create-password\"]");
  }

  get createPasswordInput() {
    return $("#create-password-input input");
  }

  get errorMessageText() {
    return $("[data-testid=\"error-message-text\"]");
  }

  get hintInput() {
    return $("#create-hint-input input");
  }

  get id() {
    return "[data-testid=\"create-password-page\"]";
  }

  get screenTitle() {
    return $("[data-testid=\"create-password-title\"]");
  }

  get screenTopParagraph() {
    return $("[data-testid=\"create-password-top-paragraph\"]");
  }

  get skipButton() {
    return $("[data-testid='action-button']");
  }

  get passwordAcceptCriteriaParagraph() {
    return $("[data-testid=\"password-accept-criteria\"]");
  }

  get pageInforTitle() {
    return $(".setup-password > .page-info");
  }

  get addPasswordButton() {
    return $("[data-testid='primary-button']");
  }

  get setUpLaterButton() {
    return $("[data-testid='tertiary-button']");
  }

  async loads() {
    await expect(this.screenTitle).toBeDisplayed();
    await expect(this.screenTitle).toHaveText(CreatePassword.Title);
    await expect(this.screenTopParagraph).toBeDisplayed();
    await expect(this.screenTopParagraph).toHaveText(
      CreatePassword.Description
    );
    await expect(this.createPasswordInput).toBeDisplayed();
    await expect(this.confirmPasswordInput).toBeDisplayed();
    await expect(this.hintInput).toBeDisplayed();
    await expect(this.createPasswordButton).toBeExisting();
    await expect(this.skipButton).toBeDisplayed();
  }
}

export default new CreatePasswordScreen();
