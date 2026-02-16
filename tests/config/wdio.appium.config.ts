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
        platformName: "Android",
        "appium:automationName": "UiAutomator2",
        maxInstances: 1,
        "appium:orientation": "PORTRAIT",
        "appium:autoWebview": false, // Handle context switch manually using switchToAppWebview() helper
        "appium:noReset": false,
        "appium:fullReset": false, // Don't uninstall app, but ensure clean state
        "appium:app": process.env.APP_PATH,
        "appium:appPackage": "org.cardanofoundation.idw", // MUST match your app ID
        "appium:webviewDevtoolsPort": 9222,
        "appium:enableWebviewDetailsCollection": false, // CRITICAL: Prevents CDP collection for all webviews (eliminates 2000ms timeouts)
        "appium:newCommandTimeout": 260,
        "appium:chromedriverConnectTimeout": 80 * 1000, // 80 seconds - correct W3C format
        "appium:autoGrantPermissions": true, // Automatically grant permissions (notifications, etc.)
        "appium:avdLaunchTimeout": 120000, // 2 minutes for Android 16 emulator to launch
        "appium:androidInstallTimeout": 90000, // 90 seconds for app installation on heavy Android 16 image
        "appium:adbExecTimeout": 180000, // 180 seconds (3 minutes) for ADB commands - increased for heavy operations
        "appium:suppressKillServer": false, // Allow killing ADB server if it becomes unresponsive
        "appium:forceAppLaunch": true, // Ensures a fresh start of the app process
        "appium:chromedriverArgs": ["--disable-dev-shm-usage", "--no-sandbox"], // Helps with Webview/CDP connection issues
      },
    ]
  },
};
