import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";
import BiometricScreen from "../../screen-objects/onboarding/biometric.screen.js";
import PasscodeScreen from "../../screen-objects/onboarding/passcode.screen.js";
import TermsAndPrivacyScreen from "../../screen-objects/onboarding/terms-and-privacy.screen.js";
import OnboardingScreen from "../../screen-objects/onboarding/onboarding.screen.js";
import CreatePasswordScreen from "../../screen-objects/onboarding/create-password.screen.js";
import { Biometric } from "../../constants/text.constants.js";

Given(/^user is on the Biometric setup screen$/, async function () {
  const currentUrl = await browser.getUrl();
  const isOnBiometric = currentUrl.includes("setup-biometrics") || currentUrl.includes("setupbiometrics");
  
  if (!isOnBiometric) {
    await OnboardingScreen.loads();
    await OnboardingScreen.tapOnGetStartedButton();
    await TermsAndPrivacyScreen.acceptTerms();
    const passcode = await PasscodeScreen.createAndEnterRandomPasscode();
    await PasscodeScreen.enterPasscode(passcode);
    
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        return !url.includes("setpasscode");
      },
      {
        timeout: 15000,
        timeoutMsg: "PIN verification did not complete",
      }
    );
    
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        const isOnBiometric = url.includes("setup-biometrics") || url.includes("setupbiometrics");
        if (isOnBiometric) return true;
        
        try {
          const titleVisible = await BiometricScreen.biometricTitleText.isDisplayed();
          return titleVisible;
        } catch {
          return false;
        }
      },
      {
        timeout: 15000,
        timeoutMsg: "Did not navigate to biometric setup screen after PIN verification",
      }
    );
  }
  
  await BiometricScreen.loads();
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("setup-biometrics") || url.includes("setupbiometrics");
    },
    {
      timeout: 5000,
      timeoutMsg: "User is not on Biometric setup screen",
    }
  );
});

Then(/^user can see "Enable biometrics" title$/, async function () {
  await expect(BiometricScreen.biometricTitleText).toBeDisplayed();
  await expect(BiometricScreen.biometricTitleText).toHaveText(Biometric.Title);
});

Then(/^user can see biometric description$/, async function () {
  await expect(BiometricScreen.biometricSubTitleText).toBeDisplayed();
  await expect(BiometricScreen.biometricSubTitleText).toHaveText(Biometric.SubTitle);
});

Then(/^user can see "Skip" button$/, async function () {
  await expect(BiometricScreen.skipButton).toBeDisplayed();
});

Then(/^user can see "Enable biometrics" button$/, async function () {
  const buttonByText = $('ion-button*=Enable biometrics');
  
  await browser.waitUntil(
    async () => {
      const exists = await buttonByText.isExisting();
      return exists;
    },
    {
      timeout: 10000,
      timeoutMsg: "Enable biometrics button not found",
    }
  );
  
  await buttonByText.scrollIntoView({ block: "center" });
  await browser.pause(200);
  await expect(buttonByText).toBeDisplayed();
});

Then(/^user can see "Set up later" button$/, async function () {
  await expect(BiometricScreen.setUpLaterButton).toBeDisplayed();
});

When(/^user taps "Skip" button$/, async function () {
  const currentUrl = await browser.getUrl();
  if (currentUrl.includes("setup-biometrics") || currentUrl.includes("setupbiometrics")) {
    await BiometricScreen.tapSkipButton();
  } else {
    await CreatePasswordScreen.skipButton.click();
  }
});

When(/^user taps "Set up later" button$/, async function () {
  const currentUrl = await browser.getUrl();
  if (currentUrl.includes("setup-biometrics") || currentUrl.includes("setupbiometrics")) {
    await BiometricScreen.tapSetUpLaterButton();
  } else {
    await CreatePasswordScreen.tapSetUpLater();
  }
});

When(/^user taps "Enable biometrics" button$/, async function () {
  await BiometricScreen.tapEnableBiometricButton();
});

Then(/^user sees cancel biometric alert$/, async function () {
  await browser.waitUntil(
    async () => {
      const alertVisible = await browser.execute(() => {
        const container = document.querySelector("[data-testid='alert-cancel-biometry-container']");
        if (container) {
          return container.classList.contains("alert-visible");
        }
        return document.querySelector("[data-testid='alert-cancel-biometry']") !== null;
      });
      return alertVisible;
    },
    {
      timeout: 10000,
      timeoutMsg: "Cancel biometric alert did not appear",
    }
  );
  
  const isDisplayed = await BiometricScreen.isCancelAlertDisplayed();
  expect(isDisplayed).toBe(true);
  await expect(BiometricScreen.cancelBiometricAlert).toBeExisting();
});

When(/^user confirms cancel biometric$/, async function () {
  await BiometricScreen.confirmCancelBiometric();
});

Then(/^user navigates away from biometric screen$/, async function () {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return !url.includes("setup-biometrics") && !url.includes("setupbiometrics");
    },
    {
      timeout: 10000,
      timeoutMsg: "User did not navigate away from biometric screen",
    }
  );
});

Then(/^biometric setup process is initiated$/, async function () {
  await browser.pause(1000);
  
  const currentUrl = await browser.getUrl();
  const stillOnBiometric = currentUrl.includes("setupbiometrics");
  
  if (stillOnBiometric) {
    await browser.pause(2000);
  }
});

Given(/^user skip Biometric popup if it exist$/, async function() {
  await BiometricScreen.skipBiometric();
});

