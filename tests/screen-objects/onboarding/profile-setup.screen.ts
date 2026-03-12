import { expect } from "expect-webdriverio";
import { browser } from "@wdio/globals";

export class ProfileSetupScreen {
  get pageContainer() {
    return $("[data-testid='profile-setup-page']");
  }

  get individualProfileOption() {
    return $("[data-testid='identifier-select-individual']");
  }

  get groupProfileOption() {
    return $("[data-testid='identifier-select-group']");
  }

  get description() {
    return $(".profile-type .subtitle");
  }

  get confirmButton() {
    return $("[data-testid='primary-button-profile-setup']");
  }

  get usernameInput() {
    return $("[data-testid='profile-user-name'] input");
  }

  get profileSetupDescription() {
    return $(".setup-profile .subtitle");
  }

  get welcomeTitle() {
    return $(".finish-setup h3");
  }

  get welcomeDescription() {
    return $(".finish-setup p");
  }

  get continueButton() {
    return $("[data-testid='primary-button-profile-setup']");
  }

  get groupNameInput() {
    return $("[data-testid='profile-group-name'] input");
  }

  get joinGroupButton() {
    return $("[data-testid='join-group-button']");
  }

  get groupSetupDescription() {
    return $(".group-setup .subtitle");
  }

  async loads() {
    // Wait for profile type options to be displayed (more lenient check)
    await browser.waitUntil(
      async () => await this.isProfileTypeScreenDisplayed(),
      {
        timeout: 15000,
        timeoutMsg: "Profile type screen did not appear",
      }
    );
  }

  async isProfileTypeScreenDisplayed(): Promise<boolean> {
    try {
      const individualVisible = await this.individualProfileOption.isDisplayed().catch(() => false);
      const groupVisible = await this.groupProfileOption.isDisplayed().catch(() => false);
      return individualVisible && groupVisible;
    } catch {
      return false;
    }
  }

  async selectIndividualProfile() {
    await expect(this.individualProfileOption).toBeDisplayed();
    await this.individualProfileOption.click();
  }

  async selectGroupProfile() {
    await expect(this.groupProfileOption).toBeDisplayed();
    await this.groupProfileOption.click();
  }

  async enterGroupName(groupName: string) {
    await expect(this.groupNameInput).toBeDisplayed();
    await this.groupNameInput.click();
    await this.groupNameInput.clearValue();
    // Use setValue which should trigger ionInput events automatically
    await this.groupNameInput.setValue(groupName);
    // Also trigger ionInput event explicitly to ensure React state updates
    await browser.execute((testId: string, value: string) => {
      const ionInputElement = document.querySelector(`[data-testid="${testId}"]`) as any;
      if (ionInputElement) {
        const ionInputEvent = new CustomEvent('ionInput', {
          detail: { value },
          bubbles: true,
          cancelable: true
        });
        ionInputElement.dispatchEvent(ionInputEvent);
      }
    }, 'profile-group-name', groupName);
    // Wait for React state to update and validation to trigger
    await browser.pause(1000);
  }

  async waitForGroupSetupScreen() {
    await browser.waitUntil(
      async () => {
        return await this.groupNameInput.isExisting().catch(() => false);
      },
      {
        timeout: 15000,
        timeoutMsg: "Group setup screen did not appear",
      }
    );
    await expect(this.groupNameInput).toBeDisplayed();
  }

  async enterUsername(username: string) {
    await expect(this.usernameInput).toBeDisplayed();
    await this.usernameInput.click();
    await this.usernameInput.clearValue();
    // Use setValue which should trigger ionInput events automatically
    await this.usernameInput.setValue(username);
    // Also trigger ionInput event explicitly to ensure React state updates
    await browser.execute((testId: string, value: string) => {
      const ionInputElement = document.querySelector(`[data-testid="${testId}"]`) as any;
      if (ionInputElement) {
        const ionInputEvent = new CustomEvent('ionInput', {
          detail: { value },
          bubbles: true,
          cancelable: true
        });
        ionInputElement.dispatchEvent(ionInputEvent);
      }
    }, 'profile-user-name', username);
    // Wait for React state to update and validation to trigger
    await browser.pause(1000);
  }

  async isConfirmButtonEnabled(): Promise<boolean> {
    const disabled = await this.confirmButton.getAttribute("disabled");
    return disabled === null;
  }

  async waitForProfileSetupScreen() {
    await browser.waitUntil(
      async () => {
        return await this.usernameInput.isExisting().catch(() => false);
      },
      {
        timeout: 15000,
        timeoutMsg: "Profile setup screen did not appear",
      }
    );
    await expect(this.usernameInput).toBeDisplayed();
  }

  async waitForWelcomeScreen() {
    await browser.waitUntil(
      async () => {
        return await this.welcomeTitle.isExisting().catch(() => false);
      },
      {
        timeout: 15000,
        timeoutMsg: "Welcome screen did not appear",
      }
    );
    await expect(this.welcomeTitle).toBeDisplayed();
  }

  /** Wait until group is active (user on home) or timeout. */
  async waitForGroupActive(timeoutMs: number) {
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        return url.includes("/tabs/home");
      },
      {
        timeout: timeoutMs,
        timeoutMsg: `Group did not become active within ${timeoutMs}ms (expected redirect to home)`,
      }
    );
  }
}

export default new ProfileSetupScreen();

