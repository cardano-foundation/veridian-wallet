import { Given, Then, When, Before } from "@wdio/cucumber-framework";
import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";
import CreatePasswordScreen from "../../screen-objects/onboarding/create-password.screen.js";
import OnboardingScreen from "../../screen-objects/onboarding/onboarding.screen.js";
import TermsAndPrivacyScreen from "../../screen-objects/onboarding/terms-and-privacy.screen.js";
import PasscodeScreen from "../../screen-objects/onboarding/passcode.screen.js";
import BiometricScreen from "../../screen-objects/onboarding/biometric.screen.js";
import { CreatePassword } from "../../constants/text.constants.js";
import AlertModal from "../../screen-objects/components/alert.modal.js";

let passwordScreenNavigated = false;
let lastPasswordScreenUrl: string | null = null;

Before({ tags: "@onboarding and @password and (@validation or @error or @strength or @visibility or @criteria)" }, async function () {
  if (passwordScreenNavigated) {
    const currentUrl = await browser.getUrl();
  }
});

Given(/^user is on the Create Password setup screen$/, async function () {
  const currentUrl = await browser.getUrl();
  if (!currentUrl.includes("createpassword")) {
    await OnboardingScreen.loads();
    await OnboardingScreen.tapOnGetStartedButton();
    await TermsAndPrivacyScreen.acceptTerms();
    const passcode = await PasscodeScreen.createAndEnterRandomPasscode();
    await PasscodeScreen.enterPasscode(passcode);
    await BiometricScreen.skipBiometric();
  }
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("createpassword");
    },
    {
      timeout: 10000,
      timeoutMsg: "User is not on Create Password screen",
    }
  );
  await CreatePasswordScreen.loadsSetupScreen();
});

Then(/^user can see "Create a password" title$/, async function () {
  await expect(CreatePasswordScreen.setupScreenTitle).toBeDisplayed();
  const titleText = await CreatePasswordScreen.setupScreenTitle.getText();
  expect(titleText).toMatch(/create.*password/i);
});

Then(/^user can see setup password description$/, async function () {
  await expect(CreatePasswordScreen.setupScreenDescription).toBeDisplayed();
});

Then(/^user can see padlock icon$/, async function () {
  await expect(CreatePasswordScreen.padlockIcon).toBeDisplayed();
});

Then(/^user can see "Add a password" button$/, async function () {
  const buttonByText = $('ion-button*=Add a password');
  await expect(buttonByText).toBeDisplayed();
});

Then(/^user can see "Set up later" button on password screen$/, async function () {
  await expect(CreatePasswordScreen.setUpLaterButton).toBeDisplayed();
});

Then(/^user can see "Skip" button on password screen$/, async function () {
  await expect(CreatePasswordScreen.skipButton).toBeDisplayed();
});

When(/^user taps "Add a password" button$/, async function () {
  await CreatePasswordScreen.tapAddPassword();
});

Given(/^user is on the Password creation screen$/, async function () {
  const currentUrl = await browser.getUrl();
  
  const isAlreadyOnForm = await CreatePasswordScreen.createPasswordInput.isDisplayed().catch(() => false);
  
  if (isAlreadyOnForm) {
    await CreatePasswordScreen.confirmPasswordInput.waitForDisplayed({ timeout: 2000 }).catch(() => {});
    return;
  }
  
  if (!currentUrl.includes("createpassword")) {
    await OnboardingScreen.loads();
    await OnboardingScreen.tapOnGetStartedButton();
    await TermsAndPrivacyScreen.acceptTerms();
    const passcode = await PasscodeScreen.createAndEnterRandomPasscode();
    await PasscodeScreen.enterPasscode(passcode);
    await BiometricScreen.skipBiometric();
    
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        return url.includes("createpassword");
      },
      {
        timeout: 10000,
        timeoutMsg: "Not on create password page",
      }
    );
  }
  
  const isOnSetupScreen = await CreatePasswordScreen.pageInforTitle.isDisplayed().catch(() => false);
  if (isOnSetupScreen) {
    await CreatePasswordScreen.tapAddPassword();
    await browser.waitUntil(
      async () => {
        const inputExists = await CreatePasswordScreen.createPasswordInput.isDisplayed().catch(() => false);
        return inputExists;
      },
      {
        timeout: 10000,
        timeoutMsg: "Password creation form did not appear after clicking Add a password",
      }
    );
  } else {
    await CreatePasswordScreen.createPasswordInput.waitForDisplayed({ timeout: 5000 });
    await CreatePasswordScreen.confirmPasswordInput.waitForDisplayed({ timeout: 5000 });
  }
  
  await CreatePasswordScreen.loadsPasswordCreationScreen();
});

Given(/^user navigates to password creation screen once$/, async function () {
  const currentUrl = await browser.getUrl();
  
  const isAlreadyOnForm = await CreatePasswordScreen.createPasswordInput.isDisplayed().catch(() => false);
  if (isAlreadyOnForm) {
    passwordScreenNavigated = true;
    lastPasswordScreenUrl = currentUrl;
    return;
  }
  
  if (currentUrl.includes("createpassword")) {
    const isOnSetupScreen = await CreatePasswordScreen.pageInforTitle.isDisplayed().catch(() => false);
    if (isOnSetupScreen) {
      await CreatePasswordScreen.tapAddPassword();
      await browser.waitUntil(
        async () => {
          const inputExists = await CreatePasswordScreen.createPasswordInput.isDisplayed().catch(() => false);
          return inputExists;
        },
        {
          timeout: 10000,
          timeoutMsg: "Password creation form did not appear",
        }
      );
      passwordScreenNavigated = true;
      lastPasswordScreenUrl = await browser.getUrl();
      return;
    }
  }
  
  await OnboardingScreen.loads();
  await OnboardingScreen.tapOnGetStartedButton();
  await TermsAndPrivacyScreen.acceptTerms();
  const passcode = await PasscodeScreen.createAndEnterRandomPasscode();
  await PasscodeScreen.enterPasscode(passcode);
  await BiometricScreen.skipBiometric();
  
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("createpassword");
    },
    {
      timeout: 10000,
      timeoutMsg: "Not on create password page",
    }
  );
  
  const isOnSetupScreen = await CreatePasswordScreen.pageInforTitle.isDisplayed().catch(() => false);
  if (isOnSetupScreen) {
    await CreatePasswordScreen.tapAddPassword();
    await browser.waitUntil(
      async () => {
        const inputExists = await CreatePasswordScreen.createPasswordInput.isDisplayed().catch(() => false);
        return inputExists;
      },
      {
        timeout: 10000,
        timeoutMsg: "Password creation form did not appear",
      }
    );
  } else {
    await CreatePasswordScreen.createPasswordInput.waitForDisplayed({ timeout: 5000 });
    await CreatePasswordScreen.confirmPasswordInput.waitForDisplayed({ timeout: 5000 });
  }
  
  passwordScreenNavigated = true;
  lastPasswordScreenUrl = await browser.getUrl();
});

Given(/^password form is cleared$/, async function () {
  const isOnForm = await CreatePasswordScreen.createPasswordInput.isDisplayed().catch(() => false);
  if (!isOnForm) {
    await browser.execute(() => {
      console.warn("Not on password screen, Background navigation may have failed");
    });
    const currentUrl = await browser.getUrl();
    if (!currentUrl.includes("createpassword")) {
      await OnboardingScreen.loads();
      await OnboardingScreen.tapOnGetStartedButton();
      await TermsAndPrivacyScreen.acceptTerms();
      const passcode = await PasscodeScreen.createAndEnterRandomPasscode();
      await PasscodeScreen.enterPasscode(passcode);
      await BiometricScreen.skipBiometric();
      
      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl();
          return url.includes("createpassword");
        },
        {
          timeout: 10000,
          timeoutMsg: "Not on create password page",
        }
      );
    }
    
    const isOnSetupScreen = await CreatePasswordScreen.pageInforTitle.isDisplayed().catch(() => false);
    if (isOnSetupScreen) {
      await CreatePasswordScreen.tapAddPassword();
      await browser.waitUntil(
        async () => {
          const inputExists = await CreatePasswordScreen.createPasswordInput.isDisplayed().catch(() => false);
          return inputExists;
        },
        {
          timeout: 10000,
          timeoutMsg: "Password creation form did not appear",
        }
      );
    }
  }
  
  await CreatePasswordScreen.clearForm();
});

Then(/^user can see "Create password" input field$/, async function () {
  await expect(CreatePasswordScreen.createPasswordInput).toBeDisplayed();
});

Then(/^user can see "Confirm password" input field$/, async function () {
  await expect(CreatePasswordScreen.confirmPasswordInput).toBeDisplayed();
});

Then(/^user can see "Create a hint \(optional\)" input field$/, async function () {
  await expect(CreatePasswordScreen.hintInput).toBeDisplayed();
});

Then(/^user can see "Create password" button$/, async function () {
  await expect(CreatePasswordScreen.createPasswordButton).toBeExisting();
});

Then(/^user can see "Symbol guide" link$/, async function () {
  await expect(CreatePasswordScreen.symbolGuideLink).toBeDisplayed();
});

Then(/^password criteria are not visible$/, async function () {
  const isVisible = await CreatePasswordScreen.isPasswordCriteriaVisible();
  expect(isVisible).toBe(false);
});

When(/^user types first character in password field$/, async function () {
  await CreatePasswordScreen.enterPassword("a");
});

Then(/^password criteria become visible$/, async function () {
  await browser.waitUntil(
    async () => {
      return await CreatePasswordScreen.isPasswordCriteriaVisible();
    },
    {
      timeout: 5000,
      timeoutMsg: "Password criteria did not become visible",
    }
  );
});

Then(/^user can see password strength indicator$/, async function () {
  await browser.waitUntil(
    async () => {
      return await CreatePasswordScreen.isPasswordStrengthVisible();
    },
    {
      timeout: 5000,
      timeoutMsg: "Password strength indicator did not appear",
    }
  );
});

Given(/^user has started typing a password$/, async function () {
  await CreatePasswordScreen.enterPassword("a");
  await browser.waitUntil(
    async () => {
      return await CreatePasswordScreen.isPasswordCriteriaVisible();
    },
    {
      timeout: 5000,
      timeoutMsg: "Password criteria did not appear",
    }
  );
});

Then(/^(\w+) criteria is struck out$/, async function (criteria: string) {
  const criteriaType = criteria.toLowerCase() as 'length' | 'lowercase' | 'uppercase' | 'number' | 'symbol';
  await browser.waitUntil(
    async () => {
      return await CreatePasswordScreen.isCriteriaStruckOut(criteriaType);
    },
    {
      timeout: 5000,
      timeoutMsg: `${criteria} criteria was not struck out`,
    }
  );
});

When(/^user enters password "([^"]*)"$/, async function (password: string) {
  await CreatePasswordScreen.enterPassword(password);
});

Then(/^user can see "([^"]*)" strength indicator$/, async function (expectedStrength: string) {
  await browser.waitUntil(
    async () => {
      const strength = await CreatePasswordScreen.getPasswordStrength();
      return strength.toLowerCase().includes(expectedStrength.toLowerCase());
    },
    {
      timeout: 5000,
      timeoutMsg: `${expectedStrength} strength indicator did not appear`,
    }
  );
});

Given(/^user has entered a password$/, async function () {
  await CreatePasswordScreen.enterPassword("Test123!@");
});

When(/^user taps eye icon on password field$/, async function () {
  await CreatePasswordScreen.togglePasswordVisibility();
});

When(/^user taps eye icon again$/, async function () {
  await CreatePasswordScreen.togglePasswordVisibility();
});

Then(/^password is visible$/, async function () {
  await browser.waitUntil(
    async () => {
      return await CreatePasswordScreen.isPasswordVisible();
    },
    {
      timeout: 5000,
      timeoutMsg: "Password did not become visible",
    }
  );
});

Then(/^password is hidden$/, async function () {
  await browser.waitUntil(
    async () => {
      const isVisible = await CreatePasswordScreen.isPasswordVisible();
      return !isVisible;
    },
    {
      timeout: 5000,
      timeoutMsg: "Password did not become hidden",
    }
  );
});

Given(/^user has entered matching passwords$/, async function () {
  const password = "Test123!@";
  await CreatePasswordScreen.enterPassword(password);
  await CreatePasswordScreen.enterConfirmPassword(password);
});

When(/^user taps eye icon on confirm password field$/, async function () {
  await CreatePasswordScreen.toggleConfirmPasswordVisibility();
});

When(/^user taps eye icon again on confirm password$/, async function () {
  await CreatePasswordScreen.toggleConfirmPasswordVisibility();
});

Then(/^confirm password is visible$/, async function () {
  await browser.waitUntil(
    async () => {
      return await CreatePasswordScreen.isConfirmPasswordVisible();
    },
    {
      timeout: 5000,
      timeoutMsg: "Confirm password did not become visible",
    }
  );
});

Then(/^confirm password is hidden$/, async function () {
  await browser.waitUntil(
    async () => {
      const isVisible = await CreatePasswordScreen.isConfirmPasswordVisible();
      return !isVisible;
    },
    {
      timeout: 5000,
      timeoutMsg: "Confirm password did not become hidden",
    }
  );
});

When(/^user taps "Symbol guide" link$/, async function () {
  await CreatePasswordScreen.openSymbolGuide();
});

Then(/^symbol guide modal is displayed$/, async function () {
  await expect(CreatePasswordScreen.symbolModal).toBeDisplayed();
});

Then(/^user can see symbol guide table$/, async function () {
  const modalContent = await CreatePasswordScreen.symbolModal.getText();
  expect(modalContent.length).toBeGreaterThan(0);
});

When(/^user closes symbol guide modal$/, async function () {
  await CreatePasswordScreen.closeSymbolGuide();
});

Then(/^symbol guide modal is closed$/, async function () {
  await browser.waitUntil(
    async () => {
      return !(await CreatePasswordScreen.symbolModal.isDisplayed().catch(() => false));
    },
    {
      timeout: 5000,
      timeoutMsg: "Symbol guide modal did not close",
    }
  );
});

Then(/^"Create password" button is disabled$/, async function () {
  const isEnabled = await CreatePasswordScreen.isCreatePasswordButtonEnabled();
  expect(isEnabled).toBe(false);
});

When(/^user enters confirm password "([^"]*)"$/, async function (password: string) {
  await CreatePasswordScreen.enterConfirmPassword(password);
  await browser.pause(1000);
});

Then(/^"Create password" button is still disabled$/, async function () {
  const isEnabled = await CreatePasswordScreen.isCreatePasswordButtonEnabled();
  expect(isEnabled).toBe(false);
});

Then(/^"Create password" button is enabled$/, async function () {
  await browser.waitUntil(
    async () => {
      return await CreatePasswordScreen.isCreatePasswordButtonEnabled();
    },
    {
      timeout: 5000,
      timeoutMsg: "Create password button did not become enabled",
    }
  );
});

Then(/^user sees "Passwords do not match" error$/, async function () {
  await browser.execute(() => {
    const input = document.querySelector("#confirm-password-input input") as HTMLElement | null;
    if (input) {
      input.blur();
    }
  });
  await browser.pause(500);
  
  await browser.waitUntil(
    async () => {
      try {
        const errorExists = await browser.execute(() => {
          const errorContainer = document.querySelector("[data-testid='error-message']");
          if (!errorContainer) return false;
          return errorContainer.classList.contains("visible");
        });
        if (!errorExists) return false;
        
        const errorText = await CreatePasswordScreen.errorMessageText.getText();
        return errorText.toLowerCase().includes("match") || 
               errorText.toLowerCase().includes("not match") ||
               errorText.toLowerCase().includes("don't match");
      } catch {
        return false;
      }
    },
    {
      timeout: 10000,
      timeoutMsg: "Password mismatch error did not appear",
    }
  );
});

Then(/^password mismatch error is cleared$/, async function () {
  await browser.waitUntil(
    async () => {
      const errorExists = await CreatePasswordScreen.errorMessageText.isDisplayed().catch(() => false);
      if (!errorExists) return true;
      const errorText = await CreatePasswordScreen.errorMessageText.getText();
      return !errorText.toLowerCase().includes("match");
    },
    {
      timeout: 5000,
      timeoutMsg: "Password mismatch error was not cleared",
    }
  );
});

Then(/^user can see "([^"]*)" error message$/, async function (expectedErrorMessage: string) {
  await browser.execute(() => {
    const input = document.querySelector("#create-password-input input") as HTMLElement | null;
    if (input) {
      input.blur();
    }
  });
  await browser.pause(500);
  
  await browser.waitUntil(
    async () => {
      try {
        const errorExists = await browser.execute(() => {
          const errorContainer = document.querySelector("[data-testid='error-message']");
          if (!errorContainer) return false;
          return errorContainer.classList.contains("visible");
        });
        if (!errorExists) return false;
        
        const errorText = await CreatePasswordScreen.errorMessageText.getText();
        return errorText.includes(expectedErrorMessage);
      } catch {
        return false;
      }
    },
    {
      timeout: 10000,
      timeoutMsg: `Error message "${expectedErrorMessage}" did not appear`,
    }
  );
  const errorText = await CreatePasswordScreen.errorMessageText.getText();
  expect(errorText).toMatch(expectedErrorMessage);
});

Then(/^user can see "Learn more" link$/, async function () {
  await browser.execute(() => {
    const input = document.querySelector("#create-password-input input") as HTMLElement | null;
    if (input) {
      input.blur();
    }
  });
  await browser.pause(500);
  
  await browser.waitUntil(
    async () => {
      const linkExists = await browser.execute(() => {
        const errorMessage = document.querySelector("[data-testid='error-message']");
        if (!errorMessage) return false;
        const learnMoreLink = errorMessage.querySelector(".learn-more");
        return learnMoreLink !== null;
      });
      return linkExists;
    },
    {
      timeout: 5000,
      timeoutMsg: "Learn more link did not appear",
    }
  );
});

When(/^user taps "Learn more" link$/, async function () {
  await browser.execute(() => {
    const errorMessage = document.querySelector("[data-testid='error-message']");
    if (errorMessage) {
      const learnMoreLink = errorMessage.querySelector(".learn-more") as HTMLElement | null;
      if (learnMoreLink) {
        learnMoreLink.click();
      }
    }
  });
  await browser.pause(500);
});

When(/^user enters hint "([^"]*)"$/, async function (hint: string) {
  await CreatePasswordScreen.enterHint(hint);
  await browser.pause(500);
});

Then(/^user sees "Your hint cannot be your password" error$/, async function () {
  await browser.execute(() => {
    const input = document.querySelector("#create-hint-input input") as HTMLElement | null;
    if (input) {
      input.blur();
    }
  });
  await browser.pause(500);
  
  await browser.waitUntil(
    async () => {
      try {
        const errorExists = await browser.execute(() => {
          const errorMessages = document.querySelectorAll("[data-testid='error-message']");
          for (const errorMsg of Array.from(errorMessages)) {
            if (errorMsg.classList.contains("visible")) {
              const errorText = errorMsg.querySelector("[data-testid='error-message-text']")?.textContent || "";
              if (errorText.toLowerCase().includes("hint") && 
                  (errorText.toLowerCase().includes("cannot") || errorText.toLowerCase().includes("can't"))) {
                return true;
              }
            }
          }
          return false;
        });
        return errorExists;
      } catch {
        return false;
      }
    },
    {
      timeout: 10000,
      timeoutMsg: "Hint error message did not appear",
    }
  );
});

Then(/^hint error is cleared$/, async function () {
  await browser.waitUntil(
    async () => {
      const errorCleared = await browser.execute(() => {
        // Check all error messages - none should contain hint error text
        const errorMessages = document.querySelectorAll("[data-testid='error-message']");
        for (const errorMsg of Array.from(errorMessages)) {
          if (errorMsg.classList.contains("visible")) {
            const errorText = errorMsg.querySelector("[data-testid='error-message-text']")?.textContent || "";
            if (errorText.toLowerCase().includes("hint") && 
                (errorText.toLowerCase().includes("cannot") || errorText.toLowerCase().includes("can't"))) {
              return false; // Hint error still exists
            }
          }
        }
        return true; // No hint error found
      });
      return errorCleared;
    },
    {
      timeout: 5000,
      timeoutMsg: "Hint error was not cleared",
    }
  );
});

Then(/^hint is saved with password$/, async function () {
  const hintValue = await CreatePasswordScreen.hintInput.getValue();
  expect(hintValue.length).toBeGreaterThan(0);
});

Then(/^user sees skip password confirmation alert$/, async function () {
  await browser.waitUntil(
    async () => {
      const alertExists = await browser.execute(() => {
        return document.querySelector("[data-testid='create-password-alert-skip']") !== null;
      });
      return alertExists;
    },
    {
      timeout: 10000,
      timeoutMsg: "Skip password confirmation alert did not appear",
    }
  );
});

When(/^user confirms skip password$/, async function () {
  await AlertModal.clickConfirmButtonOf(CreatePasswordScreen.alertModal);
});

When(/^user cancels skip password$/, async function () {
  await AlertModal.clickCancelButtonOf(CreatePasswordScreen.alertModal);
});

Given(/^skip Create Password screen$/, async function () {
  await TermsAndPrivacyScreen.acceptIfPresent();
  await CreatePasswordScreen.tapSetUpLater();
  await AlertModal.clickConfirmButtonOf(CreatePasswordScreen.alertModal);
});

Then(/^user navigates to the next screen after password creation$/, async function () {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return !url.includes("createpassword");
    },
    {
      timeout: 10000,
      timeoutMsg: "User did not navigate away from password screen",
    }
  );
});

Then(/^user remains on Create Password setup screen$/, async function () {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes("createpassword");
    },
    {
      timeout: 5000,
      timeoutMsg: "User is not on Create Password screen",
    }
  );
  await CreatePasswordScreen.loadsSetupScreen();
});

When(/^user confirms the password$/, async function () {
  if (!this.password) {
    throw new Error("No password was created. Please create a password first.");
  }
  await CreatePasswordScreen.enterConfirmPassword(this.password);
  await browser.pause(1000);
});

When(/^user taps "Create password" button$/, async function () {
  await CreatePasswordScreen.tapCreatePasswordButton();
});

Then(/^password is created successfully$/, async function () {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return !url.includes("createpassword");
    },
    {
      timeout: 10000,
      timeoutMsg: "Password creation did not complete",
    }
  );
});


