import { expect } from "expect-webdriverio";

export class CredentialsScreen {
  get credentialsTitleText() {
    return $("[data-testid='tab-title-credentials'] h2");
  }

  get credentialsContentText() {
    return $("[data-testid='credentials-tab-cards-placeholder'] p");
  }

  async loads() {
    await expect(this.credentialsTitleText).toBeDisplayed();
    await expect(this.credentialsTitleText).toHaveText("Credentials");
    await expect(this.credentialsContentText).toBeDisplayed();
    await expect(this.credentialsContentText).toHaveText("No credentials yet. They will appear here once a connection issues them.")
  }
}

export default new CredentialsScreen();