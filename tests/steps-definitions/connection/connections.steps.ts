import { Given, Then, When } from "@wdio/cucumber-framework";
import TabBar from "../../screen-objects/components/tab.bar";
import ConnectionsScreen from "../../screen-objects/connection/connections.screen";
import CredentialsScreen from "../../screen-objects/credentials/credentials.screen";

Given(/^user tap Credentials button on Tab bar$/, async function() {
  await TabBar.credentialsTabButton.click();
});

When(/^user tap Connections icon on Credentials screen$/, async function() {
  await ConnectionsScreen.connectionButton.click();
});

Then(/^user can see empty Connections screen$/, async function() {
  await ConnectionsScreen.checkListConnection(0);
});

When(/^user tap Back arrow icon on Connections screen$/, async function() {
  await ConnectionsScreen.backButton.click();
});

Then(/^user can see empty Credentials screen$/, async function() {
  await CredentialsScreen.loads();
});