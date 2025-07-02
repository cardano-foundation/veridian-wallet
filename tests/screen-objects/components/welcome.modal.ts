import { expect } from "expect-webdriverio";
import { BaseModal } from "./base.modal.js";
import { WelcomeModalText } from "../../constants/text.constants";

export class WelcomeModal extends BaseModal {
  get confirmButton() {
    return $("[data-testid=\"primary-button-input-request\"]");
  }

  get nameInput() {
    return $("[data-testid=\"input-request-input\"] > label > div > input");
  }

  get titleText() {
    return $(".input-request-wrapper >h3");
  }

  async loads() {
    await expect(this.titleText).toBeDisplayed();
    await expect(this.titleText).toHaveText(WelcomeModalText.Title);
    await expect(this.nameInput).toBeDisplayed();
    await expect(this.confirmButton).toBeDisplayed();
  }
}

export default new WelcomeModal();
