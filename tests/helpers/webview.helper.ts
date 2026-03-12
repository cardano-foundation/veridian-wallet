/**
 * Optimized Direct Context Switch
 * "Ask for forgiveness, not permission" - tries direct switch first to bypass getContexts() greedy scan
 */
import { driver, browser } from "@wdio/globals";

const APP_PACKAGE = "org.cardanofoundation.idw";
const WEBVIEW_PREFIX = `WEBVIEW_${APP_PACKAGE}`;

/**
 * Wait for the app WebView to appear (e.g. after cold start), then switch to it.
 * Use before the first step that needs web content when the app may have just launched.
 */
export async function waitForAppWebviewAndSwitch(timeoutMs = 60000, intervalMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await driver.switchContext(WEBVIEW_PREFIX);
      return;
    } catch {
      try {
        const contexts = await driver.getContexts() as string[];
        const webview = contexts.find(c => String(c).includes("WEBVIEW") && String(c).includes(APP_PACKAGE));
        if (webview) {
          await driver.switchContext(typeof webview === "string" ? webview : (webview as { id?: string }).id || String(webview));
          return;
        }
      } catch {
        // getContexts can throw if device is settling (e.g. adb device offline)
      }
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`WebView for ${APP_PACKAGE} did not appear within ${timeoutMs}ms`);
}

export async function switchToAppWebview(): Promise<void> {
  const targetContext = WEBVIEW_PREFIX;

  console.log(`[Webview] Attempting direct switch to ${targetContext}`);
  
  try {
    // Direct switch avoids the "Greedy Scan" of getContexts()
    await driver.switchContext(targetContext);
    console.log(`[Webview] Direct switch successful`);
  } catch (e) {
    console.warn(`[Webview] Direct switch failed, falling back to filtered list...`);
    // Fallback only if direct switch fails
    try {
      const contextsPromise = driver.getContexts();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getContexts timeout')), 5000)
      );
      const contexts = await Promise.race([contextsPromise, timeoutPromise]) as any[];
      const found = contexts.find(c => {
        const s = String(c);
        return s.includes('WEBVIEW') && s.includes(APP_PACKAGE);
      });
      if (found) {
        const ctxId = typeof found === 'string' ? found : found.id || String(found);
        await driver.switchContext(ctxId);
        const url = await browser.getUrl();
        console.log(`[Webview] Fallback switch successful, attached to ${APP_PACKAGE} at ${url}`);
      } else {
        throw new Error(`Could not find webview for ${APP_PACKAGE}`);
      }
    } catch (fallbackError) {
      throw new Error(`Failed to switch to webview for ${APP_PACKAGE}: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
    }
  }
}
