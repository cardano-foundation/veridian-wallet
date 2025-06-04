import { Given, Then, When } from "@wdio/cucumber-framework";
import WelcomeMessageScreen from "../../screen-objects/onboarding/welcome-message.screen";
import IdentifierAddModal from "../../screen-objects/components/identifier/identifier-add.modal";

Then(/^user can see Welcome message$/, async function () {
  await WelcomeMessageScreen.loads(`Welcome, ${this.userName}`);
});

Given(/^user tap Add and Identifier button on Welcome message$/, async function() {
  await WelcomeMessageScreen.addIdentifierButton.click();
});

Then(/^user can see toast message about created identifier$/, async function() {
  await WelcomeMessageScreen.pendingToast();
  await WelcomeMessageScreen.createdToast();
});

When(/^user tap Cancel button on Add and Identifier screen$/, async function() {
  await IdentifierAddModal.cancelButton.click();
});

Given(/^user tap Skip button on Welcome message$/, async function() {
  await WelcomeMessageScreen.handleSkipWelcomeScreen();
  await WelcomeMessageScreen.welcomeScreenInvisible();
});