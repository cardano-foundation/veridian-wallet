import { Given, When, Then } from "@wdio/cucumber-framework";
import SsiAgentDetailsScreen from "../../screen-objects/onboarding/ssi-agent-details.screen.js";
import OnboardingScreen from "../../screen-objects/onboarding/onboarding.screen";
import PasscodeScreen from "../../screen-objects/onboarding/passcode.screen";
import BiometricScreen from "../../screen-objects/onboarding/biometric.screen";
import CreatePasswordScreen from "../../screen-objects/onboarding/create-password.screen";
import AlertModal from "../../screen-objects/components/alert.modal";
import { generateRecoveryPhraseOf, recoveryPhraseWords } from "./verify-your-recovery-phrase.steps";
import { recoveryPhrase } from "../../helpers/recovery-phrase";
import { SSIAgent } from "../../constants/text.constants";
import WelcomeModal  from "../../screen-objects/components/welcome.modal";
import MenuSettingsSupportScreen from "../../screen-objects/menu/menu-settings-support.screen";
import VerifySeedPhraseScreen from "../../screen-objects/onboarding/verify-your-recovery-phrase.screen";
import SwitchRecoverWalletScreen from "../../screen-objects/onboarding/switch-recover-wallet.screen";
import RecoverWalletScreen from "../../screen-objects/onboarding/recover-wallet.screen";

Then(/^user can see SSI Agent Details screen$/, async function () {
  await SsiAgentDetailsScreen.loads();
});

Given(/^user generate passcode and skip password and verify recovery phrase$/, async function() {
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
});

When(/^user edit Boot URL on SSI Agent Details screen$/, async function() {
  await SsiAgentDetailsScreen.bootUrlInput.setValue(SSIAgent.BootURL);
});

Then(/^user can see new value for Boot URL on SSI Agent Details screen$/, async function() {
  const actualBootURL = await SsiAgentDetailsScreen.bootUrlInputText.getAttribute("value");
  expect(actualBootURL).toBe(SSIAgent.BootURL);
});

When(/^user edit Connect URL on SSI Agent Details screen$/, async function() {
  await SsiAgentDetailsScreen.connectUrlInput.setValue(SSIAgent.ConnectURL);
});

Then(/^user can see new value for Connect URL on SSI Agent Details screen$/, async function() {
  const actualConnectURL = await SsiAgentDetailsScreen.connectUrlInputText.getAttribute("value");
  expect(actualConnectURL).toBe(SSIAgent.ConnectURL);
});

When(/^user tap Validate button on SSI Agent Details screen$/, async function() {
  await SsiAgentDetailsScreen.tapOnValidatedButton();
});

Then(/^user can see Welcome modal$/, async function() {
  await WelcomeModal.loads();
});

When(/^user tap Get more information button on SSI Agent Details screen$/, async function() {
  await SsiAgentDetailsScreen.getInformationButton.click();
});

Then(/^user can see About SSI agent modal$/, async function() {
  await SsiAgentDetailsScreen.checkAboutSSIAgentScreen();
});

When(/^user tap Done button on About SSI agent modal$/, async function() {
  await SsiAgentDetailsScreen.doneButton.click();
});

When(/^user tap Onboarding documentation button on About SSI agent modal$/, async function() {
  await SsiAgentDetailsScreen.onboardingDocumentationButton.click()
});

Then(/^user can see Onboarding documentation$/, async function() {
  await MenuSettingsSupportScreen.navigateToAnotherWebview();
  await MenuSettingsSupportScreen.checkTitle("Onboarding");

});

When(/^user tap Switch to recover a wallet button on SSI Agent Details screen$/, async function() {
  await SsiAgentDetailsScreen.switchToRecoveryWalletButton.click();
});

When(/^user tap Continue button on Before you switch modal for recover a wallet flow$/, async function() {
  await SwitchRecoverWalletScreen.loads();
  await SwitchRecoverWalletScreen.confirmCheckbox.click();
  await SwitchRecoverWalletScreen.continueButton.click();
});

Then(/^user can see Recover Wallet screen$/, async function() {
  await RecoverWalletScreen.loads()
});

Then(/^user can see Before you switch modal for recover a wallet flow$/, async function() {
  await SwitchRecoverWalletScreen.loads();
});

When(/^user tap Back button on Before you switch modal for recover a wallet flow$/, async function() {
  await SwitchRecoverWalletScreen.backButton.click();
});