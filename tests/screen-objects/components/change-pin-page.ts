import { expect } from "expect-webdriverio";

export class ChangePinPage {
  get cancelButton() {
    return $("[data-testid='change-pin-page'] [data-testid='close-button-label']");
  }

  async tapOnCancelButton() {
    await expect(this.cancelButton).toBeDisplayed();
    await expect(this.cancelButton).toBeEnabled();
    await this.cancelButton.click();
  }
}

export default new ChangePinPage();