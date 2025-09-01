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
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(30);
  const { setPauseTimestamp } = useActivityTimer();

  const checkBiometrics = async () => {
    if (!Capacitor.isNativePlatform()) {
      const result = { isAvailable: false, biometryType: BiometryType.NONE };
      setBiometricInfo(result);
      return result;
    }
    try {
      const biometricResult: AvailableResult = await NativeBiometric.isAvailable();
      setBiometricInfo(biometricResult);
      return biometricResult;
    } catch (error) {
      const result = { isAvailable: false, biometryType: BiometryType.NONE };
      setBiometricInfo(result);
      return result;
    }
  };

  useEffect(() => {
    checkBiometrics();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (lockoutEndTime) {
      const updateRemaining = () => {
        const remaining = Math.max(0, Math.ceil((lockoutEndTime - Date.now()) / 1000));
        setRemainingLockoutSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setLockoutEndTime(null);
          setRemainingLockoutSeconds(30);
        }
      };

      updateRemaining();
      interval = setInterval(updateRemaining, 1000);

      return () => {
        clearInterval(interval);
      };
    } else {
      setRemainingLockoutSeconds(30);
    }
  }, [lockoutEndTime]);

  const handleBiometricAuth = async (isInitialSetup = false): Promise<BiometricAuthOutcome> => {
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
      } else {
        await NativeBiometric.verifyIdentity({
          reason: i18n.t("biometry.reason") as string,
          title: i18n.t("biometry.title") as string,
          subtitle: i18n.t("biometry.subtitle") as string,
          negativeButtonText: i18n.t("biometry.canceltitle") as string,
        });
      }

      if (!isInitialSetup) {
        await NativeBiometric.getCredentials({
          server: BIOMETRIC_SERVER_KEY,
        });
      }

      setPauseTimestamp(new Date().getTime());
      return BiometricAuthOutcome.SUCCESS;
    } catch (error) {
      let code = BiometricAuthError.UNKNOWN_ERROR;

      if (isBiometricPluginError(error)) {
        const parsedCode = typeof error.code === 'string' ? parseInt(error.code, 10) : error.code;
        code = isNaN(parsedCode) ? BiometricAuthError.UNKNOWN_ERROR : parsedCode;
      }

      let outcome: BiometricAuthOutcome;

      if (Capacitor.getPlatform() === 'ios' && code === BiometricAuthError.BIOMETRICS_UNAVAILABLE) {
        outcome = BiometricAuthOutcome.USER_CANCELLED;
      } else {
        switch (code) {
          case BiometricAuthError.USER_CANCEL:
            outcome = BiometricAuthOutcome.USER_CANCELLED;
            break;
          case BiometricAuthError.USER_TEMPORARY_LOCKOUT:
            if (lockoutEndTime === null) {
              setLockoutEndTime(Date.now() + (30 * 1000));
            }
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
      biometryType === BiometryType.MULTIPLE;

    if (!isStrongBiometry) {
      return BiometricAuthOutcome.WEAK_BIOMETRY;
    }

    try {
      await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER_KEY,
      });
      return BiometricAuthOutcome.SUCCESS;
    } catch (error) {
      let authOutcome: BiometricAuthOutcome;
      try {
        authOutcome = await handleBiometricAuth(true);
      } catch (authError) {
        return BiometricAuthOutcome.GENERIC_ERROR;
      }

      if (authOutcome !== BiometricAuthOutcome.SUCCESS) {
        return authOutcome;
      }

      try {
        const credOptions: SetCredentialOptions = {
          server: BIOMETRIC_SERVER_KEY,
          username: BIOMETRIC_SERVER_USERNAME,
          password: "",
        };
        await NativeBiometric.setCredentials(credOptions);
        return BiometricAuthOutcome.SUCCESS;
      } catch (setCredError) {
        return BiometricAuthOutcome.GENERIC_ERROR;
      }
    }
  };

  return {
    biometricInfo,
    handleBiometricAuth,
    setupBiometrics,
    checkBiometrics,
    remainingLockoutSeconds,
    lockoutEndTime
  };
};

export { useBiometricAuth, BiometryError, BiometricAuthOutcome, BIOMETRIC_SERVER_KEY };