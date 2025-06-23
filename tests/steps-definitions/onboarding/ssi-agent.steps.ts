import { Given, When, Then } from "@wdio/cucumber-framework";
import SsiAgentDetailsScreen from "../../screen-objects/onboarding/ssi-agent-details.screen.js";
import OnboardingScreen from "../../screen-objects/onboarding/onboarding.screen";
import PasscodeScreen from "../../screen-objects/onboarding/passcode.screen";
import BiometricScreen from "../../screen-objects/onboarding/biometric.screen";
import CreatePasswordScreen from "../../screen-objects/onboarding/create-password.screen";
import AlertModal from "../../screen-objects/components/alert.modal";
import { generateRecoveryPhraseOf, recoveryPhraseWords } from "./verify-your-recovery-phrase.steps";
import { recoveryPhrase } from "../../helpers/recovery-phrase";
import VerifyYourRecoveryPhraseScreen from "../../screen-objects/onboarding/verify-your-recovery-phrase.screen";
import { SSIAgent } from "../../constants/text.constants";

Then(/^user can see SSI Agent Details screen$/, async function () {
  await SsiAgentDetailsScreen.loads();
});

Given(/^user generate passcode and skip password and verify recovery phrase$/, async function() {
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
  await VerifyYourRecoveryPhraseScreen.verifyButton.click();
});

When(/^user edit Boot URL on SSI Agent Details screen$/, async function() {
  await SsiAgentDetailsScreen.bootUrlInput.setValue(SSIAgent.BootURL);
});

Then(/^user can see new value for Boot URL on SSI Agent Details screen$/, async function() {
  const actualValue = await SsiAgentDetailsScreen.bootUrlInputText.getAttribute("value");
  expect(actualValue).toBe(SSIAgent.BootURL);
});
