import { BaseModal } from "./base.modal.js";

export class WelcomeModal extends BaseModal {
  get cancelButton() {
    return $("[data-testid='confirm-view-seedpharse'] [data-testid='close-button']");
  }

  get screenCheckbox() {
    return $('[data-testid="condition-select-0"]');
  }

  get identityCheckbox() {
    return $('[data-testid="condition-select-1"]');
  }

  get accessCheckbox() {
    return $('[data-testid="condition-select-2"]');
  }

  get viewRecoveryPhraseButton() {
    return $('[data-testid="primary-button-confirm-view-seedpharse"]');
  }

  async confirmConditionAndClickViewRecoveryPhraseButton() {
    await this.screenCheckbox.click();
    await this.identityCheckbox.click();
    await this.accessCheckbox.click();
    await this.viewRecoveryPhraseButton.waitForClickable();
    await this.viewRecoveryPhraseButton.click();
  }
}

export default new WelcomeModal();
