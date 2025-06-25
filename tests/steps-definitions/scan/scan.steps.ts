import { When, Then } from "@wdio/cucumber-framework";
import ScanScreen from "../../screen-objects/scan/scan.screen";
import { Scan } from "../../constants/text.constants";

When(/^user click on scan button$/, async function () {
  await ScanScreen.scanItem.click();
});

Then(/^scan screen load correctly$/, async function () {
  await ScanScreen.loads();
});

When(/^user paste faulty content$/, async function () {
  await ScanScreen.inputToPasteContentTextbox(Scan.InvalidContent);
  await ScanScreen.clickConfirmButtonOf(ScanScreen.confirmButton);
});

Then(/^a error message appear$/, async function () {
  await ScanScreen.checkErrorMessage();
  await ScanScreen.confirmAlertButton.click();
});

When(/^user paste content$/, async function() {
  await ScanScreen.inputToPasteContentTextbox(Scan.ValidContent);
  await ScanScreen.clickConfirmButtonOf(ScanScreen.confirmButton);
});

Then(/^connection setup successfully$/, async function() {
  await ScanScreen.checkToast();
  await ScanScreen.checkListConnection(1);
});