import {config as sharedConfig} from "./wdio.appium.config.js";

export const config = {
  ...sharedConfig,
  ...{
    capabilities: sharedConfig.capabilities.map((capability) => ({
      ...capability,
      platformName: "iOS",
      "appium:deviceName": "iPhone 16 Pro Max",
      "appium:platformVersion": "18.3",
      "appium:automationName": "XCUITest",
    })),
  },
};
