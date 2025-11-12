

import {config as sharedConfig} from "./wdio.config.js";
import process from "process";

export const config = {
  ...sharedConfig,
  ...{
    host: "0.0.0.0",
    port: 4723,
    services: [
      [
        "appium",
        {
          // For options see
          // https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-appium-service
          args: {
            // For arguments see
            // https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-appium-service
            // This is needed to tell Appium that we can execute local ADB commands
            // and to automatically download the latest version of ChromeDriver
            relaxedSecurity: true,
            allowInsecure: ["chromedriver_autodownload"],
            log: "./tests/.appium/appium.log",
            logLevel: "info",
          },
          command: "appium",
        },
      ],
    ],
    capabilities: [
      {
        // For W3C the appium capabilities need to have an extension prefix
        // This is `appium:` for all Appium Capabilities which can be found here
        // http://appium.io/docs/en/writing-running-appium/caps/
        maxInstances: 1,
        "appium:orientation": "PORTRAIT",
        "appium:autoWebview": true,
        "appium:noReset": false,
        "appium:app": process.env.APP_PATH,
        "appium:newCommandTimeout": 260,
        "appium:webviewConnectTimeout": 80 * 1000, // 80 seconds
      },
    ]
  },
};
