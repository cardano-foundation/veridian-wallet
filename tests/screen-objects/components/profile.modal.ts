import { expect } from "expect-webdriverio";

export class ProfileModal {
  get titleText() {
    return $("[data-testid='profile-type-title']");
  }

  get confirmButton() {
    return $("[data-testid='primary-button-profile-setup']");
  }

  get usernameTextbox() {
    return $("#ion-input-2");
  }

  async loads() {
    await expect(this.titleText).toBeDisplayed();
    await expect(this.titleText).toHaveText("Profile type");
    await expect(this.confirmButton).toBeDisplayed();
  }
}

export default new ProfileModal();