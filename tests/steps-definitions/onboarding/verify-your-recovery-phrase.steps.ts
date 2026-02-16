import { Given, Then, When } from "@wdio/cucumber-framework";
import { recoveryPhrase } from "../../helpers/recovery-phrase.js";
import AlertModal from "../../screen-objects/components/alert.modal.js";
import YourRecoveryPhraseScreen from "../../screen-objects/onboarding/your-recovery-phrase.screen.js";
import VerifyYourRecoveryPhraseScreen from "../../screen-objects/onboarding/verify-your-recovery-phrase.screen.js";

export let recoveryPhraseWords: string[] = [];

export async function generateRecoveryPhraseOf() {
  await YourRecoveryPhraseScreen.loads();
  await YourRecoveryPhraseScreen.viewRecoveryPhraseButton.waitForClickable();
  await YourRecoveryPhraseScreen.viewRecoveryPhraseButton.scrollIntoView();
  await YourRecoveryPhraseScreen.viewRecoveryPhraseButton.click();
  recoveryPhraseWords = await recoveryPhrase().save();
  (global as any).recoveryPhraseWords = recoveryPhraseWords;
  await YourRecoveryPhraseScreen.termsAndConditionsCheckbox.click();
  await YourRecoveryPhraseScreen.continueButton.scrollIntoView();
  await YourRecoveryPhraseScreen.continueButton.click();
  await AlertModal.clickConfirmButtonOf(YourRecoveryPhraseScreen.alertModal);
  await VerifyYourRecoveryPhraseScreen.loads();
}

Given(/^user verify Your Recovery Phrase$/, async function () {
  await generateRecoveryPhraseOf();
  await recoveryPhrase().select(recoveryPhraseWords);
  await VerifyYourRecoveryPhraseScreen.verifyButton.click();
});

Given(
  /^user continue after choose and save words of recovery phrase$/,
  async function () {
    await generateRecoveryPhraseOf();
  }
);

When(
  /^user select words from his recovery phrase on Verify Your Recovery Phrase screen$/,
  async function () {
    await recoveryPhrase().select(recoveryPhraseWords);
  }
);

When(
  /^user tap Continue button on Verify Your Recovery Phrase screen$/,
  async function () {
    await VerifyYourRecoveryPhraseScreen.verifyButton.click();
  }
);

Then(/^user can see Verify Your Recovery Phrase screen$/, async function () {
  await VerifyYourRecoveryPhraseScreen.loads();
});
