import { Given, Then, When } from "@wdio/cucumber-framework";
import UNDPWelcomeScreen from "../../screen-objects/onboarding/undp-welcome.screen";
import IdentifierAddModal from "../../screen-objects/components/identifier/identifier-add.modal";

Then(/^user can see Welcome message$/, async function () {
  await UNDPWelcomeScreen.loads(`Welcome, ${this.userName}`);
});

Given(/^user tap Add and Identifier button on Welcome message$/, async function() {
  await UNDPWelcomeScreen.addIdentifierButton.click();
});

Then(/^user can see toast message about created identifier$/, async function() {
  await UNDPWelcomeScreen.pendingToast();
  await UNDPWelcomeScreen.createdToast();
});

When(/^user tap Cancel button on Add and Identifier screen$/, async function() {
  await IdentifierAddModal.cancelButton.click();
});

Given(/^user tap Skip button on Welcome message$/, async function() {
  await UNDPWelcomeScreen.handleSkipUNDPScreen();
  await UNDPWelcomeScreen.welcomeScreenInvisible();
});