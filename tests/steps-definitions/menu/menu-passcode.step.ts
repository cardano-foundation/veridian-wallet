import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "expect-webdriverio";
import MenuPasscodeScreen from "../../screen-objects/menu/menu-passcode.screen.js";
import PasscodeScreen from "../../screen-objects/onboarding/passcode.screen.js";
import { Passcode } from "../../constants/text.constants.js";

Then(
  /^user can see Create new passcode screen from Menu screen$/,
  async function () {
    await MenuPasscodeScreen.loads();
  }
);

When(
  /^user tap Can't remember button on Re-enter your Passcode screen from Menu screen$/,
  async function () {
    await MenuPasscodeScreen.cantRememberButton.click();
  }
);

When(
  /^user tap forgotten passcode button on Passcode screen from Menu screen$/,
  async function () {
    await MenuPasscodeScreen.tapOnForgottenPasswordButton();
  }
);

Then(
  /^user can see Enter passcode screen from Menu screen$/,
  async function () {
    await MenuPasscodeScreen.loadsOnEnterPasscodeScreen();
  }
);

// Passcode verification steps (used in menu/settings contexts)
When(/^user enter passcode on Verify Passcode screen$/, async function () {
  await PasscodeScreen.enterPasscode(
    this.passcode,
    '[data-testid="verify-passcode"]'
  );
});

When(
  /^user enter generated passcode on Verify Passcode screen$/,
  async function () {
    await PasscodeScreen.createAndEnterRandomPasscode();
  }
);

Then(
  /^user can see (.*) on Verify Passcode screen$/,
  async function (errorMessage: string) {
    await expect(await MenuPasscodeScreen.errorMessageText.getText()).toMatch(
      errorMessage
    );
  }
);

// Menu-specific passcode creation steps
Given(
  /^user enter a generated passcode on Passcode screen$/,
  async function () {
    this.passcode = await PasscodeScreen.createAndEnterRandomPasscode();
    // Check if we're in menu passcode change flow (re-enter new passcode screen)
    if (await MenuPasscodeScreen.changePinTitle.isExisting()) {
      const titleText = await MenuPasscodeScreen.changePinTitle.getText();
      // Only re-enter if not on "Re-enter new passcode" screen
      if (titleText !== Passcode.TitleReEnterNewPasscode) {
        await PasscodeScreen.enterPasscode(this.passcode);
      }
    }
  }
);

When(/^user re-enter passcode on Passcode screen$/, async function () {
  await PasscodeScreen.enterPasscode(this.passcode);
});

Then(
  /^user can see (.*) on Passcode screen$/,
  async function (errorMessage: string) {
    await expect(await PasscodeScreen.errorMessageText.getText()).toMatch(
      errorMessage
    );
  }
);
