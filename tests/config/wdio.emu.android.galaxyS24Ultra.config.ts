import {config as sharedConfig} from "./wdio.appium.config.js";

export const config = {
  ...sharedConfig,
  ...{
    capabilities: sharedConfig.capabilities.map((capability) => ({
      ...capability,
      "appium:deviceName": process.env.AVD_NAME || "Galaxy S24 Ultra",
    })),
  },
};
