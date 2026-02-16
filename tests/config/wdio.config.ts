import type { Options } from "@wdio/types";
import "dotenv/config";
import { returnBoolean } from "../helpers/parse.js";
import * as fs from "fs";
import * as path from "path";

export const config: Options.Testrunner = {
  runner: "local",
  tsConfigPath: 'tsconfig.json',
  specs: ["../features/**/*.feature"],
  specFileRetries: 0,
  specFileRetriesDelay: 3,
  specFileRetriesDeferred: false,
  maxInstances: 1,
  logLevel: "debug",
  bail: 0,
  baseUrl: "LACK_OF_BASE_URL",
  waitforTimeout: 45000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: [],
  framework: "cucumber",
  reporters: [
    "spec",
    [
      "allure",
      {
        outputDir: "./tests/.reports/allure-results",
        addConsoleLogs: true,
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: true,
        useCucumberStepReporter: true,
      },
    ],
  ],
  cucumberOpts: {
    backtrace: false,
    requireModule: [],
    failAmbiguousDefinitions: true,
    failFast: false,
    format: ["pretty"],
    colors: true,
    ignoreUndefinedDefinitions: false,
    names: [],
    snippets: true,
    source: true,
    profile: [],
    require: [
      "./tests/steps-definitions/**/*.ts",
      "./tests/actions/**/*.ts",
    ],
    tags: "",
    timeout: 100 * 1000,
  },
  onPrepare: function (config, capabilities) {
    const screenshotsDir = path.join(process.cwd(), "tests", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log(`[WDIO] Created screenshots directory: ${screenshotsDir}`);
    }
    
    // Pre-test "Hitman" strategy: Force-stop problematic background apps
    console.log("[Setup] Suppressing background webview processes...");
    try {
      const { execSync } = require('child_process');
      // Kill the specific apps that keep hanging the CDP bridge
      execSync('adb shell am force-stop com.google.android.apps.messaging', { stdio: 'ignore' });
      execSync('adb shell am force-stop com.android.chrome', { stdio: 'ignore' });
      // Clear stale devtools sockets that trigger the 2000ms timeout
      execSync('adb shell "rm /data/local/tmp/webview-devtools-remote*" 2>/dev/null || true', { stdio: 'ignore' });
    } catch (e) {
      console.warn("[Setup] Process suppression failed, but proceeding...");
    }
  },
  beforeScenario: async function (scenario) {
    try {
      const { driver, browser } = await import("@wdio/globals");
      const { execSync } = require('child_process');
      
      // Aggressive process suppression before each scenario
      try {
        execSync('adb shell am force-stop com.google.android.apps.messaging', { stdio: 'ignore', timeout: 5000 });
        execSync('adb shell am force-stop com.android.chrome', { stdio: 'ignore', timeout: 5000 });
      } catch (e) {
        // Ignore suppression failures
      }
      
      await browser.pause(1000);
      
      // Try direct switch to NATIVE_APP first (avoid getContexts() greedy scan)
      try {
        await driver.switchContext('NATIVE_APP');
      } catch (e) {
        // Fallback: use getContexts() with timeout protection
        try {
          const contextsPromise = driver.getContexts();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getContexts timeout')), 5000)
          );
          const contexts = await Promise.race([contextsPromise, timeoutPromise]) as any[];
          
          const nativeContext = contexts.find((ctx) => {
            const ctxStr = typeof ctx === 'string' ? ctx : ctx.id || String(ctx);
            return !ctxStr.includes('WEBVIEW');
          });
          
          if (nativeContext) {
            const nativeCtxStr = typeof nativeContext === 'string' ? nativeContext : nativeContext.id || String(nativeContext);
            await driver.switchContext(nativeCtxStr);
          }
        } catch (e) {
          // If all else fails, try direct switch anyway
          try {
            await driver.switchContext('NATIVE_APP');
          } catch (e) {}
        }
      }
      
      // Handle permission dialogs
      try {
        const dontAllowButton = await driver.$('//android.widget.Button[@text="Don\'t allow" or @text="DON\'T ALLOW" or @text="Not now" or @text="Deny" or @text="DENY"]');
        if (await dontAllowButton.isExisting().catch(() => false) && await dontAllowButton.isDisplayed().catch(() => false)) {
          await dontAllowButton.click();
        } else {
          await driver.pressKeyCode(4);
        }
        await browser.pause(500);
      } catch (e) {}
      
      // Switch to webview if needed (use direct switch first)
      try {
        await driver.switchContext('WEBVIEW_org.cardanofoundation.idw');
      } catch (e) {
        // Fallback only if direct switch fails
        try {
          const contextsPromise = driver.getContexts();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getContexts timeout')), 5000)
          );
          const contexts = await Promise.race([contextsPromise, timeoutPromise]) as any[];
          
          const webviewContext = contexts.find((ctx) => {
            const ctxStr = typeof ctx === 'string' ? ctx : ctx.id || String(ctx);
            return ctxStr.includes('WEBVIEW') && ctxStr.includes('org.cardanofoundation.idw');
          });
          if (webviewContext) {
            const webviewCtxStr = typeof webviewContext === 'string' ? webviewContext : webviewContext.id || String(webviewContext);
            await driver.switchContext(webviewCtxStr);
          }
        } catch (e) {
          // Ignore webview switch failures in beforeScenario
        }
      }
    } catch (e) {
      // Silently continue if beforeScenario fails
    }
  },
  afterScenario: async function (world, result, context) {
    const { driver } = await import("@wdio/globals");
    const appPackage = "org.cardanofoundation.idw";
    
    try {
      // Try direct switch to NATIVE_APP first (avoid getContexts() greedy scan)
      try {
        await driver.switchContext('NATIVE_APP');
      } catch (e) {
        // Fallback: use getContexts() with timeout protection
        try {
          const contextsPromise = driver.getContexts();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getContexts timeout')), 5000)
          );
          const contexts = await Promise.race([contextsPromise, timeoutPromise]) as any[];
          
          const nativeContext = contexts.find((ctx) => {
            const ctxStr = typeof ctx === 'string' ? ctx : ctx.id || String(ctx);
            return !ctxStr.includes('WEBVIEW');
          });
          if (nativeContext) {
            const nativeCtxStr = typeof nativeContext === 'string' ? nativeContext : nativeContext.id || String(nativeContext);
            await driver.switchContext(nativeCtxStr);
          }
        } catch (e) {
          // If all else fails, try direct switch anyway
          try {
            await driver.switchContext('NATIVE_APP');
          } catch (e) {}
        }
      }
      await driver.terminateApp(appPackage);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    if (returnBoolean(process.env.RELOAD_SESSION as string)) {
      await driver.reloadSession();
    }
  },
};
