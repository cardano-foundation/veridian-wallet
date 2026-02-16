/**
 * Optimized Direct Context Switch
 * "Ask for forgiveness, not permission" - tries direct switch first to bypass getContexts() greedy scan
 */
import { driver, browser } from "@wdio/globals";

export async function switchToAppWebview(): Promise<void> {
  const appPackage = "org.cardanofoundation.idw";
  const targetContext = `WEBVIEW_${appPackage}`;

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
        return s.includes('WEBVIEW') && s.includes(appPackage);
      });
      if (found) {
        const ctxId = typeof found === 'string' ? found : found.id || String(found);
        await driver.switchContext(ctxId);
        const url = await browser.getUrl();
        console.log(`[Webview] Fallback switch successful, attached to ${appPackage} at ${url}`);
      } else {
        throw new Error(`Could not find webview for ${appPackage}`);
      }
    } catch (fallbackError) {
      throw new Error(`Failed to switch to webview for ${appPackage}: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
    }
  }
}
