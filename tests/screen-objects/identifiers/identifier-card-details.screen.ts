import { expect } from "expect-webdriverio";
import { format } from "date-fns";
import BaseModal from "../components/base.modal.js";
import { IdentifierDetails } from "../../constants/text.constants.js";

export class IdentifierCardDetailsScreen {
  creationTimestampLocator = "creation-timestamp";
  identifierIdLocator = "identifier-id";
  signingKeyLocator = "signingkey";

  get alertModal() {
    return '[data-testid="alert-confirm-identifier-delete-details"]';
  }

  get deleteIdentifierButton() {
    return $('[data-testid="delete-button-identifier-card-details"]');
  }

  get favouriteButton() {
    return $('[data-testid="heart-button"]');
  }

  get optionsButton() {
    return $('[data-testid="identifier-options-button"]');
  }

  get screenTitle() {
    return $('[data-testid="list-header-title-identifier-details"]');
  }

  get shareButton() {
    return $('[data-testid="share-button"]');
  }

  get showAdvancedDetailsButton() {
    return $('[data-testid="show-advanced-block-nav-button"]');
  }

  identifierCardTemplateModal(index: number) {
    return `[data-testid="identifier-card-template-default-index-${index}"]`;
  }

  async blockTextValueFor(blockName: string) {
    return $(`[data-testid="${blockName}-block-text-value"]`);
  }

  async cardCreationDateText(index: number) {
    return $(
      `${this.identifierCardTemplateModal(
        index
      )} [data-testid="card-created-${index}"]`
    );
  }

  async cardDisplayNameText(index: number) {
    return $(
      `${this.identifierCardTemplateModal(
        index
      )} [data-testid="card-display-name-${index}"]`
    );
  }

  async copyButtonFor(name: string) {
    return $(`[data-testid="${name}-block-copy-button"]`);
  }

  async keyValueFor(blockName: string) {
    return $(`[data-testid="${blockName}-key-value"]`);
  }

  async signingKeyValueLocator(index: number) {
    return `signing-key-${index}`;
  }

  async textValueFor(blockName: string) {
    return $(`[data-testid="${blockName}-text-value"]`);
  }

  async assertCardDisplayName(identifierName: string) {
    await (await this.cardDisplayNameText(0)).waitForDisplayed();
    await expect(await this.cardDisplayNameText(0)).toHaveText(identifierName);
  }

  async loads(identifierName: string) {
    await expect($(BaseModal.closeButtonLocator)).toBeDisplayed();
    await expect(this.favouriteButton).toBeDisplayed();
    await expect(this.shareButton).toBeDisplayed();
    await expect(this.optionsButton).toBeDisplayed();
    await this.assertCardDisplayName(identifierName);
    await expect(await this.cardCreationDateText(0)).toHaveText(
      format(new Date(), "dd/MM/yyyy")
    );
    await expect(this.screenTitle).toHaveText(IdentifierDetails.Title);
    await expect(
      await this.blockTextValueFor(this.identifierIdLocator)
    ).toHaveText("Identifier ID");
    await expect(
      await this.textValueFor(this.identifierIdLocator)
    ).not.toBeNull();
    await expect(
      await this.copyButtonFor(this.identifierIdLocator)
    ).toBeExisting();
    await expect(await this.blockTextValueFor("created")).toHaveText("Created");
    await expect(
      await this.keyValueFor(this.creationTimestampLocator)
    ).toHaveText(format(new Date(), "dd/MM/yyyy"));
    await expect(
      await this.textValueFor(this.creationTimestampLocator)
    ).not.toBeNull();
    await expect(
      await this.blockTextValueFor(this.signingKeyLocator)
    ).toHaveText("Signing key");
    await expect(
      await this.textValueFor(await this.signingKeyValueLocator(0))
    ).not.toBeNull();
    await expect(
      await this.copyButtonFor(this.signingKeyLocator)
    ).toBeExisting();
    await expect(this.showAdvancedDetailsButton).toBeExisting();
    await expect(this.deleteIdentifierButton).toBeExisting();
  }
}

export default new IdentifierCardDetailsScreen();
