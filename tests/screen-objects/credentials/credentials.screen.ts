import { expect } from "expect-webdriverio";
import { Credentials } from "../../constants/text.constants";

export class CredentialsScreen {
  get credentialsTitleText() {
    return $("[data-testid='tab-title-credentials'] h2");
  }

  get credentialsContentText() {
    return $("[data-testid='credentials-tab-cards-placeholder'] p");
  }

  async loads() {
    await expect(this.credentialsTitleText).toBeDisplayed();
    await expect(this.credentialsTitleText).toHaveText(Credentials.Title);
    await expect(this.credentialsContentText).toBeDisplayed();
    await expect(this.credentialsContentText).toHaveText(Credentials.ContentText);
  }
}

export default new CredentialsScreen();