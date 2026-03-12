import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";
import allure from "@wdio/allure-reporter";
import ProfileSetupScreen from "../../screen-objects/onboarding/profile-setup.screen.js";

Then(/^user can see "Individual profile" option$/, async function () {
  await expect(ProfileSetupScreen.individualProfileOption).toBeDisplayed();
});

Then(/^user can see "Group profile" option$/, async function () {
  await expect(ProfileSetupScreen.groupProfileOption).toBeDisplayed();
});

Then(/^user can see "Choose your profile type" description$/, async function () {
  await expect(ProfileSetupScreen.description).toBeDisplayed();
  const descriptionText = await ProfileSetupScreen.description.getText();
  expect(descriptionText).toContain("Which type of profile");
});

Then(/^user can see Confirm button$/, async function () {
  await expect(ProfileSetupScreen.confirmButton).toBeDisplayed();
});

When(/^user selects Individual profile option$/, async function () {
  await ProfileSetupScreen.selectIndividualProfile();
});

When(/^user selects Group profile option$/, async function () {
  await ProfileSetupScreen.selectGroupProfile();
});

When(/^user taps Confirm button on Profile type screen$/, async function () {
  await expect(ProfileSetupScreen.confirmButton).toBeDisplayed();
  await ProfileSetupScreen.confirmButton.click();
  try {
    // Wait for either group setup or individual profile setup screen based on selection
    await browser.waitUntil(
      async () => {
        const groupNameInput = await ProfileSetupScreen.groupNameInput.isExisting().catch(() => false);
        const usernameInput = await ProfileSetupScreen.usernameInput.isExisting().catch(() => false);
        return groupNameInput || usernameInput;
      },
      {
        timeout: 15000,
        timeoutMsg: "Did not navigate to setup screen after confirming profile type",
      }
    );
  } catch (e) {
    // Capture visible errors (toast, error text) so we know if Confirm caused an error
    const currentUrl = await browser.getUrl().catch(() => "");
    const pageErrors = await browser
      .execute(() => {
        const errorEls = document.querySelectorAll(
          '[data-testid*="error"], [class*="error"], [class*="Error"], ion-toast .toast-message'
        );
        return Array.from(errorEls)
          .map((el) => el.textContent?.trim())
          .filter(Boolean)
          .join(" | ");
      })
      .catch(() => "");
    throw new Error(
      `Confirm on profile type failed. Did not navigate to setup screen. Current URL: ${currentUrl}. ${pageErrors ? `Page errors/toast: ${pageErrors}` : ""}`
    );
  }
  // If group setup screen, wait for it; otherwise wait for profile setup screen
  const isGroupSetup = await ProfileSetupScreen.groupNameInput.isExisting().catch(() => false);
  if (isGroupSetup) {
    await ProfileSetupScreen.waitForGroupSetupScreen();
  } else {
    await ProfileSetupScreen.waitForProfileSetupScreen();
  }
});

Then(/^user can see Profile setup screen$/, async function () {
  await ProfileSetupScreen.waitForProfileSetupScreen();
});

Then(/^user can see Group setup screen$/, async function () {
  await ProfileSetupScreen.waitForGroupSetupScreen();
});

Then(/^user can see "Set up your individual profile" description$/, async function () {
  await expect(ProfileSetupScreen.profileSetupDescription).toBeDisplayed();
  const descriptionText = await ProfileSetupScreen.profileSetupDescription.getText();
  expect(descriptionText).toContain("Add information about you");
});

Then(/^user can see Username input field$/, async function () {
  await expect(ProfileSetupScreen.usernameInput).toBeDisplayed();
});

Given(/^user is on Profile setup screen with Individual profile selected$/, async function () {
  if (!(await ProfileSetupScreen.usernameInput.isExisting().catch(() => false))) {
    // Navigate to profile setup if not already there
    await ProfileSetupScreen.selectIndividualProfile();
    await ProfileSetupScreen.confirmButton.click();
    await ProfileSetupScreen.waitForProfileSetupScreen();
  }
});

Given(/^user is on Group setup screen with Group profile selected$/, async function () {
  if (!(await ProfileSetupScreen.groupNameInput.isExisting().catch(() => false))) {
    // Navigate to group setup if not already there
    await ProfileSetupScreen.selectGroupProfile();
    await ProfileSetupScreen.confirmButton.click();
    await ProfileSetupScreen.waitForGroupSetupScreen();
  }
});

When(/^user enters username "(.*)"$/, async function (username: string) {
  await ProfileSetupScreen.enterUsername(username);
  // Wait for React state to update and validation to trigger
  await browser.pause(1000);
});

When(/^user enters group name "(.*)"$/, async function (groupName: string) {
  await ProfileSetupScreen.enterGroupName(groupName);
  // Wait for React state to update and validation to trigger
  await browser.pause(1000);
});

Then(/^Confirm button is disabled$/, async function () {
  const isEnabled = await ProfileSetupScreen.isConfirmButtonEnabled();
  expect(isEnabled).toBe(false);
});

Then(/^Confirm button is enabled$/, async function () {
  // Wait a bit more for React state to fully update
  await browser.pause(500);
  await browser.waitUntil(
    async () => {
      const isEnabled = await ProfileSetupScreen.isConfirmButtonEnabled();
      return isEnabled === true;
    },
    {
      timeout: 10000,
      timeoutMsg: "Confirm button did not become enabled",
    }
  );
});

When(/^user taps Confirm button on Profile setup screen$/, async function () {
  await expect(ProfileSetupScreen.confirmButton).toBeDisplayed();
  const wasEnabled = await ProfileSetupScreen.isConfirmButtonEnabled();
  if (!wasEnabled) {
    throw new Error("Confirm button is disabled; cannot click. Ensure username is valid and button is enabled.");
  }
  await ProfileSetupScreen.confirmButton.click();
  console.log("[E2E] Confirm button on Profile setup was clicked");
  // Short pause then check if we're still on profile setup or if any error appeared
  await browser.pause(2000);
  const stillOnProfileSetup = await ProfileSetupScreen.usernameInput.isDisplayed().catch(() => false);
  if (stillOnProfileSetup) {
    const errorText = await browser
      .execute(() => {
        const el = document.querySelectorAll(
          '[data-testid*="error"], [class*="error"], [class*="Error"], ion-toast .toast-message, [class*="toast"]'
        );
        return Array.from(el).map((n) => n.textContent?.trim()).filter(Boolean).join(" | ");
      })
      .catch(() => "");
    const url = await browser.getUrl().catch(() => "");
    const msg = `Still on Profile setup 2s after Confirm. URL: ${url}. ${errorText ? `Errors/toast: ${errorText}` : "No visible error text."}`;
    console.warn("[E2E]", msg);
    allure.addAttachment("Profile setup: state 2s after Confirm", msg, "text/plain");
  }
  // Allow time for profile creation to start before waiting for welcome screen (CI can be slow)
  await browser.pause(5000);
  try {
    await ProfileSetupScreen.waitForWelcomeScreen();
  } catch (e) {
    const url = await browser.getUrl().catch(() => "");
    const pageErrors = await browser
      .execute(() => {
        const el = document.querySelectorAll(
          '[data-testid*="error"], [class*="error"], [class*="Error"], ion-toast .toast-message, .finish-setup'
        );
        return Array.from(el).map((n) => n.textContent?.trim()).filter(Boolean).join(" | ");
      })
      .catch(() => "");
    const body = `URL: ${url}\nVisible error/feedback: ${pageErrors || "(none)"}`;
    allure.addAttachment("Profile setup → Welcome failed: page state", body, "text/plain");
    throw e;
  }
});

When(/^user taps Confirm button on Group setup screen$/, async function () {
  await expect(ProfileSetupScreen.confirmButton).toBeDisplayed();
  await ProfileSetupScreen.confirmButton.click();
  // After confirming group name, navigate to profile setup screen (username entry)
  await ProfileSetupScreen.waitForProfileSetupScreen();
});

Then(/^user can see Welcome screen with username "(.*)"$/, async function (username: string) {
  await ProfileSetupScreen.waitForWelcomeScreen();
  await expect(ProfileSetupScreen.welcomeTitle).toBeDisplayed();
  const welcomeText = await ProfileSetupScreen.welcomeTitle.getText();
  expect(welcomeText).toContain(username);
});

Then(/^user can see "Your individual profile has been created" description$/, async function () {
  await expect(ProfileSetupScreen.welcomeDescription).toBeDisplayed();
  const descriptionText = await ProfileSetupScreen.welcomeDescription.getText();
  expect(descriptionText).toContain("profile");
});

Then(/^user can see Continue button$/, async function () {
  await expect(ProfileSetupScreen.continueButton).toBeDisplayed();
});

Given(/^user has created individual profile with username "(.*)"$/, async function (username: string) {
  // Navigate through the flow
  await ProfileSetupScreen.selectIndividualProfile();
  await ProfileSetupScreen.confirmButton.click();
  await ProfileSetupScreen.waitForProfileSetupScreen();
  await ProfileSetupScreen.enterUsername(username);
  await browser.pause(500);
  await ProfileSetupScreen.confirmButton.click();
  await ProfileSetupScreen.waitForWelcomeScreen();
});

Given(/^user has created group profile with group name "(.*)" and username "(.*)"$/, async function (groupName: string, username: string) {
  // Navigate through the flow
  await ProfileSetupScreen.selectGroupProfile();
  await ProfileSetupScreen.confirmButton.click();
  await ProfileSetupScreen.waitForGroupSetupScreen();
  await ProfileSetupScreen.enterGroupName(groupName);
  await browser.pause(500);
  await ProfileSetupScreen.confirmButton.click();
  await ProfileSetupScreen.waitForProfileSetupScreen();
  await ProfileSetupScreen.enterUsername(username);
  await browser.pause(500);
  await ProfileSetupScreen.confirmButton.click();
  await ProfileSetupScreen.waitForWelcomeScreen();
});

When(/^user taps Continue button on Welcome screen$/, async function () {
  await expect(ProfileSetupScreen.continueButton).toBeDisplayed();
  await ProfileSetupScreen.continueButton.click();
  // Wait for navigation - could be homepage (individual) or group-profile-setup (group)
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("tabs") || url.includes("home") || url.includes("group-profile-setup") || !url.includes("profile-setup");
    },
    {
      timeout: 15000,
      timeoutMsg: "Did not navigate away from Welcome screen",
    }
  );
});

Then(/^user can see Homepage$/, async function () {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("tabs") || url.includes("home");
    },
    {
      timeout: 15000,
      timeoutMsg: "Did not navigate to Homepage",
    }
  );
  // Check for common homepage elements
  const homeTab = await $("[data-testid='tab-button-home']").isExisting().catch(() => false);
  expect(homeTab).toBe(true);
});

Then(/^user can see Group profile setup screen$/, async function () {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("group-profile-setup");
    },
    {
      timeout: 15000,
      timeoutMsg: "Did not navigate to Group profile setup screen",
    }
  );
});

