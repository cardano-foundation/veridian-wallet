import { When } from "@wdio/cucumber-framework";
import TabBar from "../screen-objects/components/tab.bar";
import MenuSettingsScreen from "../screen-objects/menu/menu-settings.screen";
import ProfileSetting from "../screen-objects/components/profile-setting";

When(
  /^user navigate to Change Passcode screen on Menu section$/,
  async function () {
    await TabBar.avatarButton.click();
    await ProfileSetting.settingButton.click();
    await MenuSettingsScreen.tapOnChangePasscodeButton();
  }
);
