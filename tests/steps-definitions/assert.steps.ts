import { Then } from "@wdio/cucumber-framework";
import { driver } from "@wdio/globals";
import Assert from "../helpers/assert.js";
import { Message } from "../constants/toast.constants.js";
import { jsonSchema } from "../helpers/generate.js";

Then(/^value is copied to system clipboard$/, async function () {
  await Assert.clipboard();
});

Then(
  /^user can see toast message about copied value to clipboard$/,
  async function () {
    await Assert.toast(Message.CopiedToClipboard);
  }
);

Then(
  /^the JSON schema is correct for (KeriJson)$/,
  async function (identifierType: string) {
    await Assert.responseJsonSchema(
      atob(await driver.getClipboard()),
      jsonSchema("identifier.json.ts", identifierType)
    );
  }
);

Then(
  /^user can see toast message about updated identifier$/,
  async function () {
    await Assert.toast(Message.IdentifierSuccessfullyUpdated);
  }
);
