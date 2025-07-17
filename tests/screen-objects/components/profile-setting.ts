import { expect } from "expect-webdriverio";

export class ProfileSetting {
  get settingButton() {
    return $("[data-testid='profiles-option-button-settings']");
  }
}

export default new ProfileSetting();