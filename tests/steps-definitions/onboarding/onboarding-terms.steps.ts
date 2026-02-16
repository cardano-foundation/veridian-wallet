import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "expect-webdriverio";
import { browser, $$ } from "@wdio/globals";
import TermsAndPrivacyScreen from "../../screen-objects/onboarding/terms-and-privacy.screen.js";
import OnboardingScreen from "../../screen-objects/onboarding/onboarding.screen.js";
import PasscodeScreen from "../../screen-objects/onboarding/passcode.screen.js";

Given(/^user is on the Terms and Privacy screen$/, async function () {
  const currentUrl = await browser.getUrl();
  if (!currentUrl.includes("termsandprivacy")) {
    await OnboardingScreen.loads();
    await OnboardingScreen.tapOnGetStartedButton();
  }
  await TermsAndPrivacyScreen.loads();
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("termsandprivacy");
    },
    {
      timeout: 10000,
      timeoutMsg: "User is not on Terms and Privacy screen",
    }
  );
});

When(/^user taps on "([^"]*)" tab$/, async function (tabName: string) {
  if (tabName === "Terms") {
    await TermsAndPrivacyScreen.clickTermsTab();
  } else if (tabName === "Privacy") {
    await TermsAndPrivacyScreen.clickPrivacyTab();
  } else {
    throw new Error(`Unknown tab: ${tabName}`);
  }
  await browser.pause(500);
});

Then(/^"([^"]*)" tab is selected$/, async function (tabName: string) {
  if (tabName === "Terms") {
    const isSelected = await TermsAndPrivacyScreen.isTermsTabSelected();
    expect(isSelected).toBe(true);
  } else if (tabName === "Privacy") {
    const isSelected = await TermsAndPrivacyScreen.isPrivacyTabSelected();
    expect(isSelected).toBe(true);
  } else {
    throw new Error(`Unknown tab: ${tabName}`);
  }
});

Then(/^user can see Terms content$/, async function () {
  await browser.waitUntil(
    async () => {
      const isTermsSelected = await TermsAndPrivacyScreen.isTermsTabSelected();
      if (!isTermsSelected) {
        return false;
      }
      const introText = await browser.execute(() => {
        const intro = document.querySelector("[data-testid='terms-n-privacy-intro-text']");
        return intro?.textContent || "";
      });
      return introText.length > 0;
    },
    {
      timeout: 5000,
      timeoutMsg: "Terms content is not visible",
    }
  );
});

Then(/^user can see Privacy content$/, async function () {
  await browser.waitUntil(
    async () => {
      const isPrivacySelected = await TermsAndPrivacyScreen.isPrivacyTabSelected();
      if (!isPrivacySelected) {
        return false;
      }
      const hasContent = await browser.execute(() => {
        const intro = document.querySelector("[data-testid='terms-n-privacy-intro-text']");
        if (intro && intro.textContent && intro.textContent.length > 0) {
          return true;
        }
        const sections = document.querySelectorAll("[data-testid^='terms-n-privacy-section-']");
        return sections.length > 0;
      });
      return hasContent;
    },
    {
      timeout: 10000,
      timeoutMsg: "Privacy content is not visible",
    }
  );
});

When(/^user taps "I accept" button$/, async function () {
  await TermsAndPrivacyScreen.loads();
  await TermsAndPrivacyScreen.acceptTerms();
});

Then(/^user can see "Terms" tab$/, async function () {
  await TermsAndPrivacyScreen.loads();
  const buttons = await $$("[data-testid='term-segment-button']");
  expect(buttons.length).toBeGreaterThan(0);
  await expect(buttons[0]).toBeDisplayed();
});

Then(/^user can see "Privacy" tab$/, async function () {
  await TermsAndPrivacyScreen.loads();
  const buttons = await $$("[data-testid='term-segment-button']");
  expect(buttons.length).toBeGreaterThan(1);
  await expect(buttons[1]).toBeDisplayed();
});

Then(/^user can see "I accept" button$/, async function () {
  await TermsAndPrivacyScreen.loads();
  await expect(TermsAndPrivacyScreen.acceptButton).toBeDisplayed();
});

Then(/^user navigates to the Create PIN screen$/, async function () {
  await PasscodeScreen.loads();
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("setpasscode");
    },
    {
      timeout: 10000,
      timeoutMsg: "User did not navigate to Create PIN screen after accepting terms",
    }
  );
});

