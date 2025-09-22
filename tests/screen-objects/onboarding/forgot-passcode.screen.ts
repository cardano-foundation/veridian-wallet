import { expect } from "expect-webdriverio";
import { ForgotPasscode } from "../../constants/text.constants";

export class ForgotPasscodeScreen {
  get forgotPopupContentText() {
    return $("[data-testid='alert-forgotten'] h2");
  }

  get verifyRecoveryPhraseButton() {
    return $("[data-testid='alert-forgotten-confirm-button']")
  }

  get cancelButton() {
    return $("[data-testid='alert-forgotten-cancel-button']");
  }

  get forgotPasscodeTitle() {
    return $("[data-testid='forgot-passcode-title']");
  }

  get forgotPasscodeContentText() {
    return $("[data-testid='forgot-auth-info-paragraph-top']");
  }

  async checkForgotPasscodePopup() {
    // Wait for the popup elements to appear
    await this.forgotPopupContentText.waitForDisplayed({ 
      timeout: 10000, 
      timeoutMsg: 'Forgot passcode popup content not displayed within 10 seconds' 
    });
    
    await this.verifyRecoveryPhraseButton.waitForDisplayed({ 
      timeout: 5000, 
      timeoutMsg: 'Verify recovery phrase button not displayed within 5 seconds' 
    });
    
    await this.cancelButton.waitForDisplayed({ 
      timeout: 5000, 
      timeoutMsg: 'Cancel button not displayed within 5 seconds' 
    });
    
    // Verify popup content text
    const popupText = await this.forgotPopupContentText.getText();
    if (popupText !== ForgotPasscode.DescriptionPopup) {
      throw new Error(`Expected popup text "${ForgotPasscode.DescriptionPopup}" but got "${popupText}"`);
    }
    
    console.log(`✅ Forgot passcode popup validation PASSED: "${popupText}"`);
  }

  async checkForgotPasscodeScreen() {
    // Wait for the forgot passcode screen elements to appear with increased timeout
    await this.forgotPasscodeTitle.waitForDisplayed({ 
      timeout: 15000, 
      timeoutMsg: 'Forgot passcode title not displayed within 15 seconds' 
    });
    
    await this.forgotPasscodeContentText.waitForDisplayed({ 
      timeout: 10000, 
      timeoutMsg: 'Forgot passcode content not displayed within 10 seconds' 
    });
    
    // Get text content and verify in a single step to avoid session issues
    let titleText: string;
    let contentText: string;
    
    try {
      titleText = await this.forgotPasscodeTitle.getText();
      contentText = await this.forgotPasscodeContentText.getText();
      
      // Verify the text content matches expected values
      if (titleText !== ForgotPasscode.Title) {
        throw new Error(`Expected title "${ForgotPasscode.Title}" but got "${titleText}"`);
      }
      
      if (contentText !== ForgotPasscode.Description) {
        throw new Error(`Expected content "${ForgotPasscode.Description}" but got "${contentText}"`);
      }
      
      // If we reach here, all validations passed
      console.log(`✅ Forgot passcode screen validation PASSED:`);
      console.log(`   Title: "${titleText}"`);
      console.log(`   Content: "${contentText}"`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Forgot passcode screen validation FAILED:', errorMessage);
      throw error;
    }
  }
}

export default new ForgotPasscodeScreen();