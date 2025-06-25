import { Given, When } from "@wdio/cucumber-framework";
import AddAnIdentifierModal from "../screen-objects/components/identifier/identifier-add.modal.js";
import Assert from "../helpers/assert.js";
import Gestures from "../helpers/gestures.js";
import IdentifierCardDetailsScreen from "../screen-objects/identifiers/identifier-card-details.screen.js";
import IdentifierEditModal from "../screen-objects/components/identifier/identifier-edit.modal.js";
import IdentifierScreen from "../screen-objects/identifiers/identifiers.screen.js";
import MenuToolbar from "../screen-objects/components/menu.toolbar.js";
import { randomNameWithPrefix } from "../helpers/generate.js";
import { Message } from "../constants/toast.constants";

export async function editAndReturnIdentifierName() {
  const identifierName = await randomNameWithPrefix("edit-identifier");
  await (await IdentifierEditModal.displayNameInput).setValue(identifierName);
  return identifierName;
}

export async function inputAndReturnIdentifierName() {
  const identifierName = await randomNameWithPrefix("identifier");
  await (await AddAnIdentifierModal.displayNameInput).setValue(identifierName);
  await Gestures.tapAtPercentageOfScreenHeight(10);
  await Gestures.tapAtPercentageOfScreenHeight(10);
  return identifierName;
}

export async function addChosenIdentifierType() {
  const identifierName = inputAndReturnIdentifierName();
  await AddAnIdentifierModal.createIdentifierButton.waitForClickable();
  await AddAnIdentifierModal.createIdentifierButton.click();
  return identifierName;
}

async function addChosenIdentifierTypeByPlusIcon() {
  await MenuToolbar.addButton.click();
  const identifierName = await addChosenIdentifierType();
  await Assert.toast(Message.NewIdentifierCreatedSuccessfully);
  return identifierName;
}

Given(
  /^identifier is created and user can see Identifier Card Details screen for (Individual|Group)$/,
  async function (identifierType: string) {
    this.identifierType = identifierType;
    this.identifierName = await addChosenIdentifierTypeByPlusIcon();
    await (await IdentifierScreen.identityAllCard(0)).click();
    await IdentifierCardDetailsScreen.loads(this.identifierName);
  }
);

Given(
  /^user add (Individual|Group) identifier through plus icon$/,
  async function (identifierType: string) {
    this.identifierType = identifierType;
    this.identifierName = await addChosenIdentifierTypeByPlusIcon();
  }
);

When(
  /^user add (Individual|Group) identifier$/,
  async function (identifierType: string) {
    this.identifierType = identifierType;
    this.identifierName = await addChosenIdentifierType();
  }
);
