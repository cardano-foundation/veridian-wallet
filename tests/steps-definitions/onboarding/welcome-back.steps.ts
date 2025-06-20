import { Given, When, Then } from "@wdio/cucumber-framework";
import WelcomeBackScreen from "../../screen-objects/onboarding/welcome-back.screen";
import PasscodeScreen from "../../screen-objects/onboarding/passcode.screen";

Given(/^user had already setup a identity$/, async function() {
  await new Promise(resolve => setTimeout(resolve, 60000));
  if (await WelcomeBackScreen.welcomeBackTitle.isDisplayed()) {
    await WelcomeBackScreen.loads();
  }
});

When(/^user type in wrong passcode$/, async function() {
  await PasscodeScreen.enterPasscode(
    (this.passcode = await PasscodeScreen.createAndEnterRandomPasscode())
  );
});

Then(/^user see a error message about incorrect passcode$/, async function() {
  await WelcomeBackScreen.checkErrorMessage("Incorrect passcode");
});