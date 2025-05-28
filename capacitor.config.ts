import { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "org.cardanofoundation.idw",
  appName: "Veridian",
  webDir: "build",
  android: {
    webContentsDebuggingEnabled: process.env.ENVIRONMENT !== "prod",
    adjustMarginsForEdgeToEdge: "disable",
  },
  ios: {
    webContentsDebuggingEnabled: process.env.ENVIRONMENT !== "prod",
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: "Library/IDWalletDatabase",
      iosIsEncryption: true,
      iosKeychainPrefix: "db-encryption-bran",
      androidIsEncryption: true,
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 1000,
      backgroundColor: "#92FFC0",
    },
    PrivacyScreen: {
      enable: true,
      imageName: "Splashscreen",
      preventScreenshots: true,
    },
    Keyboard: {
      resize: KeyboardResize.Ionic,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
