import { Given } from "@wdio/cucumber-framework";
import { faker } from "@faker-js/faker";
import { recoveryPhrase } from "../helpers/recovery-phrase.js";
import {
  generateRecoveryPhraseOf,
  recoveryPhraseWords,
} from "../steps-definitions/onboarding/verify-your-recovery-phrase.steps.js";
import AlertModal from "../screen-objects/components/alert.modal.js";
import Assert from "../helpers/assert.js";
import CreatePasswordScreen from "../screen-objects/onboarding/create-password.screen.js";
import OnboardingScreen from "../screen-objects/onboarding/onboarding.screen.js";
import PasscodeScreen from "../screen-objects/onboarding/passcode.screen.js";
import SsiAgentDetailsScreen from "../screen-objects/onboarding/ssi-agent-details.screen.js";
import VerifySeedPhraseScreen from "../screen-objects/onboarding/verify-your-recovery-phrase.screen.js";
import WelcomeModal from "../screen-objects/components/welcome.modal.js";
import { returnPassword } from "../helpers/generate";
import BiometricScreen from "../screen-objects/onboarding/biometric.screen";
import WelcomeMessageScreen from "../screen-objects/onboarding/welcome-message.screen";

Given(/^user is onboarded with skipped password creation$/, async function () {
  if (await OnboardingScreen.getStartedButton.isExisting()) {
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
    await generateRecoveryPhraseOf();
    await recoveryPhrase().select(recoveryPhraseWords);
    await VerifySeedPhraseScreen.verifyButton.click();
  } else {
    await PasscodeScreen.enterPasscodeSkip();
  }
  await SsiAgentDetailsScreen.tapOnValidatedButton();
  this.userName = faker.person.firstName();
  await WelcomeModal.nameInput.setValue(this.userName);
  await WelcomeModal.confirmButton.waitForClickable();
  await WelcomeModal.confirmButton.click();
  await Assert.toast(`Welcome, ${this.userName}!`);
});

Given(/^user is onboarded with a password creation$/, async function () {
  if (await OnboardingScreen.getStartedButton.isExisting()) {
    await OnboardingScreen.tapOnGetStartedButton();
    await PasscodeScreen.enterPasscode(
      (this.passcode = await PasscodeScreen.createAndEnterRandomPasscode())
    );
    if (await BiometricScreen.biometricTitleText.isExisting()) {
      await BiometricScreen.setUpLaterButton.click();
    }
    if (await CreatePasswordScreen.pageInforTitle.isExisting()) {
      await CreatePasswordScreen.addPasswordButton.click();
    }
    (global as any).generatedPassword = await returnPassword(10);
    await CreatePasswordScreen.createPasswordInput.addValue(
      (global as any).generatedPassword
    );
    await CreatePasswordScreen.confirmPasswordInput.scrollIntoView();
    await CreatePasswordScreen.confirmPasswordInput.addValue(
      (global as any).generatedPassword
    );
    await CreatePasswordScreen.createPasswordButton.scrollIntoView();
    await CreatePasswordScreen.createPasswordButton.waitForClickable();
    await CreatePasswordScreen.createPasswordButton.click();
    await generateRecoveryPhraseOf();
    await recoveryPhrase().select(recoveryPhraseWords);
    await VerifySeedPhraseScreen.verifyButton.click();
  } else {
    await PasscodeScreen.enterPasscodeSkip();
  }
  await SsiAgentDetailsScreen.tapOnValidatedButton();
  this.userName = faker.person.firstName();
  await WelcomeModal.nameInput.setValue(this.userName);
  await WelcomeModal.confirmButton.waitForClickable();
  await WelcomeModal.confirmButton.click();
  await Assert.toast(`Welcome, ${this.userName}!`);
});

Given(/^user tap skip button on Welcome screen$/, async function () {
  await WelcomeMessageScreen.handleSkipWelcomeScreen();
});
