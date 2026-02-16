import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";
import PasscodeScreen from "../../screen-objects/onboarding/passcode.screen.js";
import TermsAndPrivacyScreen from "../../screen-objects/onboarding/terms-and-privacy.screen.js";
import OnboardingScreen from "../../screen-objects/onboarding/onboarding.screen.js";
import { Passcode } from "../../constants/text.constants.js";

Given(/^user is on the Create PIN screen$/, async function () {
  const currentUrl = await browser.getUrl();
  if (!currentUrl.includes("setpasscode")) {
    await OnboardingScreen.loads();
    await OnboardingScreen.tapOnGetStartedButton();
    await TermsAndPrivacyScreen.acceptTerms();
  }
  await PasscodeScreen.loads();
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("setpasscode");
    },
    {
      timeout: 10000,
      timeoutMsg: "User is not on Create PIN screen",
    }
  );
});

Then(/^user can see "Create your PIN" title$/, async function () {
  await expect(PasscodeScreen.screenTitle).toBeDisplayed();
  await expect(PasscodeScreen.screenTitle).toHaveText(Passcode.Title);
});

Then(/^user can see PIN description$/, async function () {
  await expect(PasscodeScreen.screenDescriptionText).toBeDisplayed();
  await expect(PasscodeScreen.screenDescriptionText).toHaveText(Passcode.Description);
});

Then(/^user can see 6 empty PIN input circles$/, async function () {
  const circles = await PasscodeScreen.passcodePoint;
  expect(circles.length).toBe(6);
  const allEmpty = await PasscodeScreen.areAllCirclesEmpty();
  expect(allEmpty).toBe(true);
});

Then(/^user can see numeric keypad$/, async function () {
  // Verify all digit buttons (0-9) are visible
  for (let i = 0; i < 10; i++) {
    await expect(await PasscodeScreen.digitButton(i)).toBeDisplayed();
  }
});

When(/^user enters a 6-digit PIN$/, async function () {
  this.passcode = await PasscodeScreen.createAndEnterRandomPasscode();
});

Given(/^user has entered a PIN$/, async function () {
  if (!this.passcode) {
    this.passcode = await PasscodeScreen.createAndEnterRandomPasscode();
  } else {
    await PasscodeScreen.enterPasscode(this.passcode);
  }
});

Given(/^user is on the Re-enter PIN screen$/, async function () {
  const currentUrl = await browser.getUrl();
  if (!currentUrl.includes("setpasscode")) {
    await OnboardingScreen.loads();
    await OnboardingScreen.tapOnGetStartedButton();
    await TermsAndPrivacyScreen.acceptTerms();
  }
  // Enter a PIN to get to re-enter screen if not already there
  if (!this.passcode) {
    this.passcode = await PasscodeScreen.createAndEnterRandomPasscode();
  }
  await browser.waitUntil(
    async () => {
      const title = await PasscodeScreen.screenTitle;
      if (await title.isDisplayed()) {
        const titleText = await title.getText();
        return titleText === Passcode.TitleReEnter;
      }
      return false;
    },
    {
      timeout: 10000,
      timeoutMsg: "Re-enter PIN screen did not appear",
    }
  );
});

Then(/^user can see "Re-enter your PIN" title$/, async function () {
  await expect(PasscodeScreen.screenTitle).toBeDisplayed();
  await expect(PasscodeScreen.screenTitle).toHaveText(Passcode.TitleReEnter);
});

Then(/^user can see re-enter PIN description$/, async function () {
  await expect(PasscodeScreen.screenDescriptionText).toBeDisplayed();
});

When(/^user re-enters the same PIN$/, async function () {
  if (!this.passcode) {
    throw new Error("No PIN was created. Please create a PIN first.");
  }
  await PasscodeScreen.enterPasscode(this.passcode);
});

When(/^user re-enters a different PIN$/, async function () {
  if (!this.passcode) {
    throw new Error("No PIN was created. Please create a PIN first.");
  }
  const originalPasscode = this.passcode;
  const differentPasscode = [...originalPasscode].reverse();
  
  if (JSON.stringify(differentPasscode) === JSON.stringify(originalPasscode)) {
    differentPasscode[0] = originalPasscode[0] === 1 ? 2 : 1;
  }
  
  await PasscodeScreen.enterPasscode(differentPasscode);
});

Then(/^PIN is verified successfully$/, async function () {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return !url.includes("setpasscode");
    },
    {
      timeout: 10000,
      timeoutMsg: "PIN verification did not complete - user is still on PIN screen",
    }
  );
});

Then(/^user sees "PIN didn't match" error message$/, async function () {
  await expect(PasscodeScreen.errorMessageText).toBeDisplayed();
  const errorText = await PasscodeScreen.errorMessageText.getText();
  expect(errorText).toMatch(/PIN.*didn.*match/i);
});

Then(/^PIN input circles are cleared$/, async function () {
  await PasscodeScreen.waitForCirclesToClear();
  const allEmpty = await PasscodeScreen.areAllCirclesEmpty();
  expect(allEmpty).toBe(true);
});

Then(/^user can re-enter PIN$/, async function () {
  const allEmpty = await PasscodeScreen.areAllCirclesEmpty();
  expect(allEmpty).toBe(true);
  await expect(await PasscodeScreen.digitButton(0)).toBeDisplayed();
});

When(/^user taps back button$/, async function () {
  const backButton = await PasscodeScreen.getBackButton();
  await backButton.waitForDisplayed({ timeout: 10000 });
  await backButton.click();
});

Then(/^user navigates away from PIN screen$/, async function () {
  // Wait for navigation away from PIN screen
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return !url.includes("setpasscode");
    },
    {
      timeout: 10000,
      timeoutMsg: "User did not navigate away from PIN screen",
    }
  );
});

Given(/^user generate passcode on Passcode screen$/, async function () {
  const currentUrl = await browser.getUrl();
  if (currentUrl.includes("termsandprivacy")) {
    await TermsAndPrivacyScreen.acceptTerms();
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        return url.includes("setpasscode");
      },
      {
        timeout: 10000,
        timeoutMsg: "Did not navigate to passcode screen after accepting terms",
      }
    );
  }
  
  await PasscodeScreen.loads();
  this.passcode = await PasscodeScreen.createAndEnterRandomPasscode();
  await PasscodeScreen.enterPasscode(this.passcode);
});

When(
  /^user tap Can't remember button on Re-enter your Passcode screen$/,
  async function () {
    await PasscodeScreen.cantRememberButton.click();
  }
);

Then(/^user can see Passcode screen$/, async function () {
  await PasscodeScreen.loads();
});

Then(/^user navigates to the Biometric setup screen$/, async function () {
  const BiometricScreen = (await import("../../screen-objects/onboarding/biometric.screen.js")).default;
  await BiometricScreen.loads();
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("setup-biometrics") || url.includes("setupbiometrics");
    },
    {
      timeout: 10000,
      timeoutMsg: "User did not navigate to Biometric setup screen after PIN verification",
    }
  );
});
