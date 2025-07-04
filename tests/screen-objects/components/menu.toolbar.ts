import { expect } from "expect-webdriverio";
import {
  findFilterAndClickElement,
} from "../base.screen.js";

export class MenuToolbar {
  backArrowButtonLocator = "[data-testid=\"back-button\"]";

  get addButton() {
    return $("[data-testid=\"add-button\"]");
  }

  get connectionsButton() {
    return $("[data-testid='tab-title-identifiers'] + ion-buttons [data-testid='connections-button']");
  }

  async clickBackArrowIcon() {
    await findFilterAndClickElement(this.backArrowButtonLocator);
  }

  async loads() {
    await expect(this.addButton).toBeDisplayed();
    await expect(this.connectionsButton).toBeDisplayed();
  }
}

export default new MenuToolbar();
