import { Given } from "@wdio/cucumber-framework";
import TabBar from "../screen-objects/components/tab.bar.js";

Given(/^user tap Avatar button on Tab bar$/, async function () {
  await TabBar.avatarButton.click();
});