import { startFreeRASP } from "capacitor-freerasp";
import React, { Dispatch, SetStateAction } from "react";
import { i18n } from "../i18n";
import { ConfigurationService } from "../core/configuration";

export enum ThreatName {
  PRIVILEGED_ACCESS = "Privileged Access",
  DEBUG = "Debug",
  SIMULATOR = "Simulator",
  APP_INTEGRITY = "App Integrity",
  UNOFFICIAL_STORE = "Unofficial Store",
  HOOKS = "Hooks",
  DEVICE_BINDING = "Device Binding",
  SECURE_HARDWARE_NOT_AVAILABLE = "Secure Hardware Not Available",
  SYSTEM_VPN = "System VPN",
  PASSCODE = "Passcode",
  SCREENSHOT = "Screenshot",
  SCREEN_RECORDING = "Screen Recording",
  OBFUSCATION_ISSUES = "Obfuscation Issues",
  DEVELOPER_MODE = "Developer Mode",
  ADB_ENABLED = "ADB Enabled",
}

export interface ThreatCheck {
  name: ThreatName;
  description: string;
}

export type FreeRASPInitResult =
  | { success: true }
  | { success: false; error: unknown };

const createThreatAction = (
  setThreatsDetected: React.Dispatch<React.SetStateAction<ThreatCheck[]>>,
  threatName: ThreatName,
  description: string
) => {
  return () => {
    setThreatsDetected((currentState) => {
      const threatExists = currentState.some(
        (threat) => threat.name === threatName
      );
      if (threatExists) {
        return currentState;
      }
      return [
        ...currentState,
        {
          name: threatName,
          description,
        },
      ];
    });
  };
};

export const initializeFreeRASP = async (
  setThreatsDetected: Dispatch<SetStateAction<ThreatCheck[]>>
): Promise<FreeRASPInitResult> => {
  const actions = {
    privilegedAccess: createThreatAction(
      setThreatsDetected,
      ThreatName.PRIVILEGED_ACCESS,
      i18n.t("systemthreats.rules.privilegedaccess")
    ),
    debug: createThreatAction(
      setThreatsDetected,
      ThreatName.DEBUG,
      i18n.t("systemthreats.rules.debug")
    ),
    simulator: createThreatAction(
      setThreatsDetected,
      ThreatName.SIMULATOR,
      i18n.t("systemthreats.rules.simulator")
    ),
    appIntegrity: createThreatAction(
      setThreatsDetected,
      ThreatName.APP_INTEGRITY,
      i18n.t("systemthreats.rules.appintegrity")
    ),
    unofficialStore: createThreatAction(
      setThreatsDetected,
      ThreatName.UNOFFICIAL_STORE,
      i18n.t("systemthreats.rules.unofficialstore")
    ),
    hooks: createThreatAction(
      setThreatsDetected,
      ThreatName.HOOKS,
      i18n.t("systemthreats.rules.hooks")
    ),
    deviceBinding: createThreatAction(
      setThreatsDetected,
      ThreatName.DEVICE_BINDING,
      i18n.t("systemthreats.rules.devicebinding")
    ),
    secureHardwareNotAvailable: createThreatAction(
      setThreatsDetected,
      ThreatName.SECURE_HARDWARE_NOT_AVAILABLE,
      i18n.t("systemthreats.rules.securehardwarenotavailable")
    ),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    systemVPN: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    passcode: () => {},
    // Note: Threat covered by the privacy screen app
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    screenshot: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    screenRecording: () => {},
    obfuscationIssues: createThreatAction(
      setThreatsDetected,
      ThreatName.OBFUSCATION_ISSUES,
      i18n.t("systemthreats.rules.obfuscationissues")
    ),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    devMode: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    adbEnabled: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    deviceID: () => {},
  };

  const freeRASPConfig = {
    androidConfig: {
      packageName: "org.cardanofoundation.idw",
      certificateHashes: [process.env.APP_CERT_HASH || ""],
    },
    iosConfig: {
      appBundleId: "org.cardanofoundation.idw",
      appTeamId: process.env.APP_TEAM_ID || "",
    },
    watcherMail: process.env.WATCHER_MAIL || "",
    isProd: ConfigurationService.env.security.rasp.enabled,
  };

  try {
    await startFreeRASP(freeRASPConfig, actions);
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};
