import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "expect-webdriverio";
import AlertModal from "../../screen-objects/components/alert.modal.js";
import CreatePasswordScreen from "../../screen-objects/onboarding/create-password.screen.js";
import { returnPassword } from "../../helpers/generate.js";
import { CreatePassword } from "../../constants/text.constants.js";

Given(/^skip Create Password screen$/, async function () {
  await CreatePasswordScreen.setUpLaterButton.click();
  await AlertModal.clickConfirmButtonOf(CreatePasswordScreen.alertModal);
});

Given(/^user tap Skip button on Create Password screen$/, async function () {
  await CreatePasswordScreen.skipButton.click();
});

Given(
  /^user generated a password of (\d+) characters$/,
  async function (passwordLength: number) {
    (global as any).generatedPassword = await returnPassword(passwordLength);
  }
);

Given(/^user type in password on Create Password screen$/, async function () {
  await CreatePasswordScreen.createPasswordInput.addValue(
    (global as any).generatedPassword
  );
});

Given(
  /^user confirm type in password on Create Password screen$/,
  async function () {
    await CreatePasswordScreen.confirmPasswordInput.scrollIntoView();
    await CreatePasswordScreen.confirmPasswordInput.addValue(
      (global as any).generatedPassword
    );
  }
);

Given(
  /^user type in hint for the password on Create Password screen$/,
  async function () {
    await CreatePasswordScreen.hintInput.scrollIntoView();
    await CreatePasswordScreen.hintInput.addValue("test hint");
  }
);

Given(
  /^user type in password (.*) on Create Password screen$/,
  async function (password: string) {
    await CreatePasswordScreen.createPasswordInput.addValue(password);
    await CreatePasswordScreen.screenTitle.click();
  }
);

Given(
  /^all conditions are displayed as passed on Create Password screen$/,
  async function () {
    await expect(
      await CreatePasswordScreen.passwordAcceptCriteriaParagraph.getText()
    ).toMatch(CreatePassword.AcceptCriteria);
  }
);

When(
  /^user tap Create Password button on Create Password screen$/,
  async function () {
    await CreatePasswordScreen.createPasswordButton.scrollIntoView();
    await CreatePasswordScreen.createPasswordButton.waitForClickable();
    await CreatePasswordScreen.createPasswordButton.click();
  }
);

Then(/^user can see Create Password screen$/, async function () {
  await CreatePasswordScreen.loads();
});

Then(
  /^user can see (.*) on Create Password screen$/,
  async function (errorMessage: string) {
    await expect(await CreatePasswordScreen.errorMessageText.getText()).toMatch(
      errorMessage
    );
  }
);
Given(/^user tap on Add a password on Create a password screen$/, async function() {
  if (await CreatePasswordScreen.pageInforTitle.isExisting()) {
    await CreatePasswordScreen.addPasswordButton.click();
  }
});