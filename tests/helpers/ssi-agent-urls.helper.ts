/**
 * Get SSI Agent URLs based on environment
 * For Android emulator, automatically uses 10.0.2.2 to reach host machine
 * Can be overridden with KERIA_IP environment variable (for iOS or physical devices)
 */
export function getSSIAgentUrls(): { bootUrl: string; connectUrl: string } {
  const ANDROID_EMULATOR_HOST = "10.0.2.2";
  const DEFAULT_HOST = "127.0.0.1";
  const BOOT_PORT = 3903;
  const CONNECT_PORT = 3901;

  const isAndroidEmulator = (() => {
    const args = process.argv.join(' ');
    if (args.includes('wdio.emu.android') || args.includes('wdio.android')) {
      return true;
    }
    
    const npmScript = process.env.npm_lifecycle_script || '';
    if (npmScript.includes('android')) {
      return true;
    }
    
    if (process.env.ANDROID_EMULATOR === 'true') {
      return true;
    }
    
    if (!process.env.KERIA_IP) {
      return true;
    }
    
    return false;
  })();
  
  const keriaIP = process.env.KERIA_IP;
  const host = isAndroidEmulator 
    ? ANDROID_EMULATOR_HOST 
    : (keriaIP || DEFAULT_HOST);
  
  return {
    bootUrl: `http://${host}:${BOOT_PORT}`,
    connectUrl: `http://${host}:${CONNECT_PORT}`,
  };
}
