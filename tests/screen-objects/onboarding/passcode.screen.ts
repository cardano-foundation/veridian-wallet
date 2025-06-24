import { expect } from "expect-webdriverio";
import { generateRandomNumbersArray } from "../../helpers/generate.js";
import { log } from "../../helpers/logger.js";
import { Passcode } from "../../constants/text.constants.js";
import BaseModal from "../components/base.modal.js";
import { delay } from "../base.screen";

export class PasscodeScreen {
  get cantRememberButton() {
    return $('[data-testid="secondary-button-set-passcode"]');
  }

  get id() {
    return '[data-testid="set-passcode-page"]';
  }

  get screenTitle() {
    return $('[data-testid="set-passcode-title"]');
  }

  get screenDescriptionText() {
    return $('[data-testid="set-passcode-description"]');
  }

  get errorMessageText() {
    return $('[data-testid="error-message-text"]');
  }

  get passcodePoint() {
    return $$(".passcode-module-circle-row > div");
  }

  async digitButton(digit: number, parentElement = "") {
    return $(
      `${parentElement} [data-testid="passcode-button-${digit}"]`.trimStart()
    );
  }

  async loads() {
    await expect($(BaseModal.closeButtonLocator)).toBeDisplayed();
    await expect(this.screenTitle).toBeDisplayed();
    await expect(this.screenTitle).toHaveText(Passcode.Title);
    await expect(this.screenDescriptionText).toBeDisplayed();
    await expect(this.screenDescriptionText).toHaveText(Passcode.Description);
    for (let i = 0; i < 10; i++) {
      await expect(await this.digitButton(i)).toBeDisplayed();
    }
  }

  async loadsReEnterScreen() {
    await expect(this.screenTitle).toBeDisplayed();
    await expect(this.screenTitle).toHaveText(Passcode.TitleReEnter);
    await expect(this.cantRememberButton).toBeDisplayed();
  }

  async enterPasscode(passcode: number[], parentElement = "") {
    const digitButtonMap: {
      [key: number]: () => Promise<void>;
    } = {};
    for (let i = 0; i < 10; i++) {
      digitButtonMap[i] = async () => {
        await (await this.digitButton(i, parentElement)).click();
      };
    }
    //clicking digits on the screen
    for (const digit of passcode) {
      await digitButtonMap[digit]();
    }
  }

  async enterPasscodeSkip() {
    const numberInput = 1;
    for (let i = 0; i < await this.passcodePoint.length; i++) {
      await this.enterPasscode([numberInput]);
      await delay(100);
    }
  }

  async createAndEnterRandomPasscode() {
    const randomPasscode = generateRandomNumbersArray();
    log.info(`randomPasscode: ${randomPasscode}`);
    await this.enterPasscode(randomPasscode);
    return randomPasscode;
  }

  async createAndEnterRandomPasscodeWithParentElement(parentElement = "") {
    const randomPasscode = generateRandomNumbersArray();
    log.info(`randomPasscode: ${randomPasscode}`);
    await this.enterPasscode(randomPasscode, parentElement);
    return randomPasscode;
  }
}

export default new PasscodeScreen();
