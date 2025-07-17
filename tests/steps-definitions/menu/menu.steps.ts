import { Then, When } from "@wdio/cucumber-framework";
import MenuScreen from "../../screen-objects/menu/menu.screen.js";
import { Message } from "../../constants/toast.constants";
import Assert from "../../helpers/assert.js";
import ProfileSetting from "../../screen-objects/components/profile-setting";

When(/^user tap Settings button on Profiles screen$/, async function () {
  await ProfileSetting.settingButton.click();
});

When(/^user tap on Profile button on Menu screen$/, async function () {
  await MenuScreen.tapOnProfileButton();
});

Then(/^user can see Menu screen$/, async function () {
  await MenuScreen.loads();
});

Then(
  /^user can see toast message about change password successfully$/,
  async function () {
    await Assert.toast(Message.PasscodeSuccessfullyUpdated);
  }
);
