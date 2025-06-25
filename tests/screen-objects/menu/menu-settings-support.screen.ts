import { expect } from "expect-webdriverio";
import { driver } from "@wdio/globals";
import { log } from "../../helpers/logger";
import { delay } from "../base.screen";

export class MenuSettingsSupportScreen {
  get termsOfUseItem() {
    return $("[data-testid='terms-modal-btn']");
  }

  get privacyPolicyItem() {
    return $("[data-testid='privacy-modal-btn']");
  }

  get backButton() {
    return $("[data-testid='close-button']");
  }

  get doneButton() {
    return $("[data-testid='close-button-label']");
  }

  get componentsText() {
    return $("h2#components");
  }

  async loadsTermsAndPrivacyScreen() {
    await this.termsOfUseItem.waitForDisplayed();
    await expect(this.termsOfUseItem).toBeDisplayed();
    await this.privacyPolicyItem.waitForDisplayed();
    await expect(this.privacyPolicyItem).toBeDisplayed();
  }

  async checkComponentsText() {
    await this.componentsText.waitForDisplayed();
    await expect(this.componentsText).toHaveText("Components");
  }

  async navigateToAnotherWebview() {
    const contexts = await driver.getContexts();
    log.info(`Contexts: ${contexts}`);
    for (let i = contexts.length - 1; i >= 1; i--) {
      await driver.switchContext(contexts[i]);
      await delay(100);
    }
  }

  async checkTitle(titleText: string) {
    const title = await driver.getTitle();
    expect(title).toContain(titleText);
  }
}
export default new MenuSettingsSupportScreen();