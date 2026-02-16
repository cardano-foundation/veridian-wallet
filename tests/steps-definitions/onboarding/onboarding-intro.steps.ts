import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "expect-webdriverio";
import OnboardingScreen from "../../screen-objects/onboarding/onboarding.screen.js";

Given(/^user is on the intro screen$/, async function () {
  await OnboardingScreen.loads();
});

Then(/^user can see "Get started" button$/, async function () {
  await expect(OnboardingScreen.getStartedButton).toBeDisplayed();
});

Then(/^user can see "I already have a wallet" link$/, async function () {
  await expect(OnboardingScreen.iAlreadyHaveAWalletButton).toBeDisplayed();
});

When(/^user taps "Get started" button$/, async function () {
  await OnboardingScreen.tapOnGetStartedButton();
});

When(/^user taps "I already have a wallet" link$/, async function () {
  await OnboardingScreen.tapOnIAlreadyHaveAWalletButton();
});
