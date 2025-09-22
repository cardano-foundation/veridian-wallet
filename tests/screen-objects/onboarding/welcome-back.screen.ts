import { expect } from "expect-webdriverio";
import { WelcomeBack } from "../../constants/text.constants";

export class WelcomeBackScreen {
  get welcomeBackTitle() {
    return $("[data-testid='lock-page-title']");
  }

  get forgotPasscodeButton() {
    return $("[data-testid='secondary-button-lock-page']");
  }

  get errorMessage() {
    return $("[data-testid='error-message-text']");
  }

  get loginUnavailableTitle() {
    return $("[data-testid='login-attempt-alert'] h2");
  }

  get loginUnavailableContent() {
    return $("[data-testid='alert-content']");
  }

  async loads() {
    expect(this.welcomeBackTitle).toBeDisplayed();
    expect(this.welcomeBackTitle).toHaveText(WelcomeBack.Title);
    expect(this.forgotPasscodeButton).toBeDisplayed();
  }

  async checkErrorMessage(message :string) {
    expect(this.errorMessage).toHaveText(message);
  }

  async checkLoginUnavailableScreen(title :string, content :string) {
    // Wait for the login unavailable alert to appear with increased timeout
    await this.loginUnavailableTitle.waitForDisplayed({ 
      timeout: 15000, 
      timeoutMsg: 'Login unavailable title not displayed within 15 seconds' 
    });
    
    // Wait for the alert content to appear
    await this.loginUnavailableContent.waitForDisplayed({ 
      timeout: 10000, 
      timeoutMsg: 'Login unavailable content not displayed within 10 seconds' 
    });
    
    // Get text content and verify in a single step to avoid session issues
    let titleText: string;
    let contentText: string;
    
    try {
      titleText = await this.loginUnavailableTitle.getText();
      contentText = await this.loginUnavailableContent.getText();
      
      // Verify the text content matches expected values
      if (titleText !== title) {
        throw new Error(`Expected title "${title}" but got "${titleText}"`);
      }
      
      if (contentText !== content) {
        throw new Error(`Expected content "${content}" but got "${contentText}"`);
      }
      
      // If we reach here, all validations passed
      console.log(`✅ Login unavailable screen validation PASSED:`);
      console.log(`   Title: "${titleText}"`);
      console.log(`   Content: "${contentText}"`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Login unavailable screen validation FAILED:', errorMessage);
      throw error;
    }
  }

  async clickOnForgottenPasscodeButton() {
    if (await this.forgotPasscodeButton.isDisplayed()) {
      await this.forgotPasscodeButton.click();
    }
  }
}
export default new WelcomeBackScreen();