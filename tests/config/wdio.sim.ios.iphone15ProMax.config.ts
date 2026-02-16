import {config as sharedConfig} from "./wdio.appium.config.js";

export const config = {
  ...sharedConfig,
  ...{
    capabilities: sharedConfig.capabilities.map((capability) => ({
      ...capability,
      platformName: "iOS",
      "appium:deviceName": "iPhone 15 Pro Max",
      "appium:platformVersion": "17.5",
      "appium:automationName": "XCUITest",
    })),
  },
};
