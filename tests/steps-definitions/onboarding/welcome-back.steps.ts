import { Given, When, Then } from "@wdio/cucumber-framework";
import WelcomeBackScreen from "../../screen-objects/onboarding/welcome-back.screen";
import PasscodeScreen from "../../screen-objects/onboarding/passcode.screen";
import ForgotPasscodeScreen from "../../screen-objects/onboarding/forgot-passcode.screen";
import { WelcomeBack } from "../../constants/text.constants";
import OnboardingScreen from "../../screen-objects/onboarding/onboarding.screen";
import BiometricScreen from "../../screen-objects/onboarding/biometric.screen";
import CreatePasswordScreen from "../../screen-objects/onboarding/create-password.screen";
import AlertModal from "../../screen-objects/components/alert.modal";

Given(/^user had already setup a identity$/, async function () {
  if (await WelcomeBackScreen.welcomeBackTitle.isDisplayed()) {
    await WelcomeBackScreen.loads();
  } else {
    await OnboardingScreen.tapOnGetStartedButton();
    await PasscodeScreen.enterPasscode(
      (this.passcode = await PasscodeScreen.createAndEnterRandomPasscode())
    );
    if (await BiometricScreen.biometricTitleText.isExisting()) {
      await BiometricScreen.setUpLaterButton.click();
    }
    if (await CreatePasswordScreen.pageInforTitle.isExisting()) {
      await CreatePasswordScreen.setUpLaterButton.click();
    }
    await AlertModal.clickConfirmButtonOf(CreatePasswordScreen.alertModal);
    await new Promise((resolve) => setTimeout(resolve, 62000));
    await WelcomeBackScreen.loads();
  }
});

When(/^user type in wrong passcode$/, async function () {
  await PasscodeScreen.createAndEnterRandomPasscode();
});

Then(/^user see a error message about incorrect passcode$/, async function () {
  await WelcomeBackScreen.checkErrorMessage(WelcomeBack.IncorrectMessage);
});

When(
  /^user make (\d+) attempts with wrong passcode$/,
  async function (attempts: number) {
    const maximumAttempts  = 5;
    if (attempts <= maximumAttempts) {
      for (let i = 0; i < attempts; i++) {
        await PasscodeScreen.createAndEnterRandomPasscode();
      }
    } else {
      for (let i = 0; i < maximumAttempts; i++) {
        this.passcode = await PasscodeScreen.createAndEnterRandomPasscode();
      }
      await new Promise((resolve) => setTimeout(resolve, 62000));
      await PasscodeScreen.enterPasscode(this.passcode);
    }
  }
);

Then(
  /^user see a toast message said (\d+) attempt remain$/,
  async function (attempts: number) {
    await WelcomeBackScreen.checkErrorMessage(`${attempts} attempt remaining`);
  }
);

Then(
  /^user cannot do anything , the screen to blank with the toast message login unavailable , retry in (\d+) min$/,
  async function (minute: number) {
    await WelcomeBackScreen.checkLoginUnavailableScreen(
      WelcomeBack.LoginUnavailableTitle,
      `Try again in ${minute} minute`
    );
  }
);

When(/^user click on forgotten passcode$/, async function() {
  await WelcomeBackScreen.clickOnForgottenPasscodeButton();
});

Then(/^user got navigate to recovery phrase screen$/, async function() {
  await ForgotPasscodeScreen.checkForgotPasscodePopup();
  await ForgotPasscodeScreen.verifyRecoveryPhraseButton.click();
  await ForgotPasscodeScreen.checkForgotPasscodeScreen();
});