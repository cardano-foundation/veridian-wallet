import {
  AvailableResult,
  BiometricAuthError,
  BiometryType,
  NativeBiometric,
  SetCredentialOptions
} from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { i18n } from "../../i18n";
import { useAppDispatch } from "../../store/hooks";
import { useActivityTimer } from "../components/AppWrapper/hooks/useActivityTimer";

class BiometryError extends Error {
  public code: BiometricAuthError;

  constructor(message: string, code: BiometricAuthError) {
    super(message);
    this.name = "BiometryError";
    this.code = code;
  }
}

const BIOMETRIC_SERVER_KEY = "com.veridianwallet.biometrics.key";
const BIOMETRIC_SERVER_USERNAME = "biometric_app_username";

enum BiometricAuthOutcome {
  SUCCESS,
  USER_CANCELLED,
  TEMPORARY_LOCKOUT,
  PERMANENT_LOCKOUT,
  GENERIC_ERROR,
  WEAK_BIOMETRY,
  NOT_AVAILABLE,
  
}

const isBiometricPluginError = (
  error: unknown,
): error is { code: BiometricAuthError | string; message: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
};

const useBiometricAuth = (isLockPage?: boolean) => {
  const [biometricInfo, setBiometricInfo] = useState<AvailableResult>({
    isAvailable: false,
    biometryType: BiometryType.NONE,
  });
  const [lockoutTimestamp, setLockoutTimestamp] = useState<number | null>(null);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(30);
  const { setPauseTimestamp } = useActivityTimer();

  const checkBiometrics = async () => {
    if (!Capacitor.isNativePlatform()) {
      const result = { isAvailable: false, biometryType: BiometryType.NONE };
      setBiometricInfo(result);
      return result;
    }
    try {
      const biometricResult: AvailableResult =
        await NativeBiometric.isAvailable();
      setBiometricInfo(biometricResult);
      return biometricResult;
    } catch (error) {
      // In case of an error checking biometrics, assume it's not available.
      const result = { isAvailable: false, biometryType: BiometryType.NONE };
      setBiometricInfo(result);
      return result;
    }
  };

  useEffect(() => {
    checkBiometrics();
  }, []);

  useEffect(() => {
    if (lockoutTimestamp) {
      const initialElapsed = Math.floor((Date.now() - lockoutTimestamp) / 1000);
      const initialRemaining = 30 - initialElapsed;
      setRemainingLockoutSeconds(initialRemaining > 0 ? initialRemaining : 0);

      const interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - lockoutTimestamp) / 1000);
        const remaining = 30 - elapsedSeconds;
        setRemainingLockoutSeconds(remaining > 0 ? remaining : 0);
        if (remaining <= 0) {
          clearInterval(interval);
          setLockoutTimestamp(null);
          setRemainingLockoutSeconds(30); // Reset for next lockout
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockoutTimestamp]);

  const handleBiometricAuth = async (): Promise<BiometricAuthOutcome> => {
    const { isAvailable, biometryType } = await checkBiometrics();

    if (!isAvailable) {
      return BiometricAuthOutcome.NOT_AVAILABLE;
    }

    const isStrongBiometry =
      biometryType === BiometryType.FACE_ID ||
      biometryType === BiometryType.TOUCH_ID ||
      biometryType === BiometryType.FINGERPRINT ||
      biometryType === BiometryType.IRIS_AUTHENTICATION ||
      biometryType === BiometryType.MULTIPLE;

    if (!isStrongBiometry) {
      return BiometricAuthOutcome.WEAK_BIOMETRY;
    }

    try {
      if (Capacitor.getPlatform() === 'android') {
        await NativeBiometric.verifyIdentity({
          reason: i18n.t("biometry.reason") as string,
          title: i18n.t("biometry.title") as string,
          subtitle: i18n.t("biometry.subtitle") as string,
          negativeButtonText: i18n.t("biometry.canceltitle") as string,
          allowedBiometryTypes: [
            BiometryType.FINGERPRINT,
            BiometryType.IRIS_AUTHENTICATION,
          ],
          maxAttempts: 5,
        });
      } else { // iOS
        await NativeBiometric.verifyIdentity({
          reason: i18n.t("biometry.reason") as string,
          title: i18n.t("biometry.title") as string,
          subtitle: i18n.t("biometry.subtitle") as string,
          negativeButtonText: i18n.t("biometry.canceltitle") as string,
        });
      }

      await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER_KEY,
      });

      setPauseTimestamp(new Date().getTime());
      return BiometricAuthOutcome.SUCCESS;
    } catch (error) {
      let code = BiometricAuthError.UNKNOWN_ERROR;

      if (isBiometricPluginError(error)) {
        const parsedCode = typeof error.code === 'string' ? parseInt(error.code, 10) : error.code;
        code = isNaN(parsedCode) ? BiometricAuthError.UNKNOWN_ERROR : parsedCode;
      }

      let outcome: BiometricAuthOutcome;

      // Workaround for iOS cancel issue
      if (Capacitor.getPlatform() === 'ios' && code === BiometricAuthError.BIOMETRICS_UNAVAILABLE) {
        outcome = BiometricAuthOutcome.USER_CANCELLED;
      } else {
        switch (code) {
          case BiometricAuthError.USER_CANCEL:
            outcome = BiometricAuthOutcome.USER_CANCELLED;
            break;
          case BiometricAuthError.USER_TEMPORARY_LOCKOUT:
            setLockoutTimestamp(Date.now());
            outcome = BiometricAuthOutcome.TEMPORARY_LOCKOUT;
            break;
          case BiometricAuthError.USER_LOCKOUT:
            outcome = BiometricAuthOutcome.PERMANENT_LOCKOUT;
            break;
          case BiometricAuthError.BIOMETRICS_UNAVAILABLE:
            outcome = BiometricAuthOutcome.NOT_AVAILABLE;
            break;
          default:
            outcome = BiometricAuthOutcome.GENERIC_ERROR;
            break;
        }
      }
      return outcome;
    }
  };

  const setupBiometrics = async (): Promise<BiometricAuthOutcome> => {
    const { isAvailable, biometryType } = await checkBiometrics();

    if (!isAvailable) {
      return BiometricAuthOutcome.NOT_AVAILABLE;
    }

    const isStrongBiometry =
      biometryType === BiometryType.FACE_ID ||
      biometryType === BiometryType.TOUCH_ID ||
      biometryType === BiometryType.FINGERPRINT ||
      biometryType === BiometryType.IRIS_AUTHENTICATION ||
      // TODO: remove
      biometryType === BiometryType.MULTIPLE;

    if (!isStrongBiometry) {
      return BiometricAuthOutcome.WEAK_BIOMETRY;
    }

    try {
      // 1. Try to get existing credentials
      await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER_KEY,
      });
      return BiometricAuthOutcome.SUCCESS; // Credentials exist, so success
    } catch (error) {
      // 2. If getting credentials fails (e.g., no credentials found), then try to set them
      //    But first, verify identity to authenticate the user.
      let authOutcome: BiometricAuthOutcome;
      try {
        authOutcome = await handleBiometricAuth(); // This will prompt the user for authentication
      } catch (authError) {
        // handleBiometricAuth should not throw, it returns an outcome.
        // This catch block is a safeguard.
        return BiometricAuthOutcome.GENERIC_ERROR;
      }

      if (authOutcome !== BiometricAuthOutcome.SUCCESS) {
        // If authentication failed (e.g., user cancelled, lockout), return that outcome
        return authOutcome;
      }

      // 3. If authentication succeeded, then set the credentials
      try {
        const credOptions: SetCredentialOptions = {
          server: BIOMETRIC_SERVER_KEY,
          username: BIOMETRIC_SERVER_USERNAME,
          password: "",
        };
        await NativeBiometric.setCredentials(credOptions);
        return BiometricAuthOutcome.SUCCESS; // Credentials set, so success
      } catch (setCredError) {
        // If setting credentials fails even after authentication, it's a generic error
        if (setCredError instanceof Error) {
          // The "User not authenticated" error should not happen here if verifyIdentity succeeded.
          // So, any error here is truly generic.
          return BiometricAuthOutcome.GENERIC_ERROR;
        }
        return BiometricAuthOutcome.GENERIC_ERROR; // Fallback
      }
    }
  };

  // Implement const isStrongBiometryAvailable =
  //  biometricInfo.biometryType === BiometryType.FACE_ID ||
  //  biometricInfo.biometryType === BiometryType.TOUCH_ID ||
  //  biometricInfo.biometryType === BiometryType.FINGERPRINT;
  return {
    biometricInfo,
    handleBiometricAuth,
    setupBiometrics,
    checkBiometrics,
    remainingLockoutSeconds,
    lockoutTimestamp,
    // isStrongBiometryAvailable
  };
};


export { useBiometricAuth, BiometryError, BiometricAuthOutcome };
