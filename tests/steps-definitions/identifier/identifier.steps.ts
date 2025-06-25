import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "expect-webdriverio";
import Assert from "../../helpers/assert.js";
import IdentifiersScreen from "../../screen-objects/identifiers/identifiers.screen.js";
import { Message } from "../../constants/toast.constants.js";
import { addChosenIdentifierType } from "../../actions/identifiers.action";

Given(
  /^user tap Add an identifier button on the Identifiers screen$/,
  async function () {
    await IdentifiersScreen.addAnIdentifierButton.click();
  }
);

When(
  /^user chose newly created identifier on Identifiers screen$/,
  async function () {
    await (await IdentifiersScreen.identityAllCard(0)).click();
    await (await IdentifiersScreen.identityAllCard(0)).waitForDisplayed({ reverse: true });
  }
);

Then(/^user can see Identifiers screen$/, async function () {
  await IdentifiersScreen.loads();
});

Then(
  /^user can see Identifiers screen with (\d+) (card|cards)$/,
  async function (cardCount: number, dummy: string) {
    await IdentifiersScreen.loads(false, cardCount);
  }
);

Then(
  /^user can see toast message about created identifier on Identifiers screen$/,
  async function () {
    await Assert.toast(Message.NewIdentifierCreatedSuccessfully);
  }
);

Then(
  /^user can see toast message about deleted identifier on Identifiers screen$/,
  async function () {
    await Assert.toast(Message.IdentifierSuccessfullyDeleted);
  }
);

Then(
  /^user can see Add An Identifier button on Identifiers screen$/,
  async function () {
    await expect(IdentifiersScreen.addAnIdentifierButton).toBeDisplayed();
  }
);

Then(
  /^user can see chosen identifier as his favourite on Identifiers screen$/,
  async function () {
    await expect(await IdentifiersScreen.identityFavouriteCard(0)).toBeDisplayed();
  }
);

Given(/^user create new Identifier$/, async function() {
  await IdentifiersScreen.addAnIdentifierButton.click();
  await addChosenIdentifierType();
});
