import {
  AvailableResult,
  BiometricAuthError,
  BiometryType,
  NativeBiometric,
  SetCredentialOptions,
} from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useState } from "react";
import { i18n } from "../../i18n";
import { useActivityTimer } from "../components/AppWrapper/hooks/useActivityTimer";
import { getAuthentication } from "../../store/reducers/stateCache";
import { useAppSelector } from "../../store/hooks";

class BiometryError extends Error {
  public code: BiometricAuthError;

  constructor(message: string, code: BiometricAuthError) {
    super(message);
    this.name = "BiometryError";
    this.code = code;
  }
}

const BIOMETRIC_SERVER_KEY = "org.cardanofoundation.idw.biometrics.key";
const BIOMETRIC_SERVER_USERNAME = "biometric_app_username";

enum BiometricAuthOutcome {
  SUCCESS,
  USER_CANCELLED,
  TEMPORARY_LOCKOUT,
  PERMANENT_LOCKOUT,
  GENERIC_ERROR,
  NOT_AVAILABLE,
}

const validErrorCodes = new Set(
  Object.values(BiometricAuthError).filter((v) => typeof v === "number")
);

const isBiometricPluginError = (
  error: unknown
): error is { code: BiometricAuthError | string; message: string } => {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    !("message" in error)
  ) {
    return false;
  }

  const err = error as { code: string | number; message: string };

  if (typeof err.code === "number") {
    return validErrorCodes.has(err.code);
  }

  if (typeof err.code === "string") {
    const parsedCode = parseInt(err.code, 10);
    return !isNaN(parsedCode) && validErrorCodes.has(parsedCode);
  }

  return false;
};

const useBiometricAuth = (isLockPage = false) => {
  const [biometricInfo, setBiometricInfo] = useState<AvailableResult>({
    isAvailable: false,
    biometryType: BiometryType.NONE,
  });
  const [lockoutEndTime, setLockoutEndTime] = useState<number>();
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0);
  const { passwordIsSet } = useAppSelector(getAuthentication);
  const { setPauseTimestamp } = useActivityTimer();

  const checkBiometrics = async () => {
    if (!Capacitor.isNativePlatform()) {
      const result = { isAvailable: false, biometryType: BiometryType.NONE };
      setBiometricInfo(result);
      return result;
    }

    // The plugin is configured by default to only look for biometrics that meet Android's "strong" security level. iOS biometry is always considered strong.
    // https://github.com/Cap-go/capacitor-native-biometric/blob/a6bbf89be872cc964a8e867119dee4cb8269fc77/android/src/main/java/ee/forgr/biometric/NativeBiometric.java#L79-L80

    const biometricResult: AvailableResult =
      await NativeBiometric.isAvailable();
    setBiometricInfo(biometricResult);

    return biometricResult;
  };

  // Memoize checkBiometrics as it's a dependency for other memoized functions
  const memoizedCheckBiometrics = useCallback(checkBiometrics, []);

  useEffect(() => {
    memoizedCheckBiometrics();
  }, [memoizedCheckBiometrics]);

  useEffect(() => {
    if (lockoutEndTime) {
      const duration = lockoutEndTime - Date.now();
      const timer = setTimeout(
        () => {
          setLockoutEndTime(undefined);
        },
        duration > 0 ? duration : 0
      );
      return () => clearTimeout(timer);
    }
  }, [lockoutEndTime]);

  useEffect(() => {
    if (lockoutEndTime) {
      const updateCountdown = () => {
        const remaining = Math.max(
          0,
          Math.ceil((lockoutEndTime - Date.now()) / 1000)
        );
        setRemainingLockoutSeconds(remaining);
      };

      const interval = setInterval(updateCountdown, 1000);
      updateCountdown();

      return () => clearInterval(interval);
    } else {
      setRemainingLockoutSeconds(0);
    }
  }, [lockoutEndTime]);

  const handleBiometricAuth = async (
    isInitialSetup = false
  ): Promise<BiometricAuthOutcome> => {
    const { isAvailable } = await memoizedCheckBiometrics();

    if (!isAvailable) {
      return BiometricAuthOutcome.NOT_AVAILABLE;
    }

    try {
      const platform = Capacitor.getPlatform();

      if (platform === "android") {
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
          fallbackTitle: i18n.t(
            !isLockPage && passwordIsSet
              ? "biometry.iosfallbackpasswordtitle"
              : "biometry.iosfallbacktitle"
          ) as string,
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
        const parsedCode =
          typeof error.code === "string"
            ? parseInt(error.code, 10)
            : error.code;
        code = isNaN(parsedCode)
          ? BiometricAuthError.UNKNOWN_ERROR
          : parsedCode;
      }

      let outcome: BiometricAuthOutcome;

      if (
        Capacitor.getPlatform() === "ios" &&
        code === BiometricAuthError.BIOMETRICS_UNAVAILABLE
      ) {
        outcome = BiometricAuthOutcome.USER_CANCELLED;
      } else {
        switch (code) {
          case BiometricAuthError.USER_CANCEL:
            outcome = BiometricAuthOutcome.USER_CANCELLED;
            break;
          case BiometricAuthError.USER_TEMPORARY_LOCKOUT:
            if (!lockoutEndTime) {
              setLockoutEndTime(Date.now() + 30 * 1000);
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
    const { isAvailable } = await memoizedCheckBiometrics();

    if (!isAvailable) {
      return BiometricAuthOutcome.NOT_AVAILABLE;
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

  // By wrapping these functions in useCallback, we provide stable references to any
  // component that uses this hook. This is crucial to prevent unintended side effects,
  // like re-running useEffects, and avoids unnecessary re-renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedHandleBiometricAuth = useCallback(handleBiometricAuth, [
    memoizedCheckBiometrics,
    lockoutEndTime,
    setPauseTimestamp,
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedSetupBiometrics = useCallback(setupBiometrics, [
    memoizedCheckBiometrics,
    memoizedHandleBiometricAuth,
  ]);

  return {
    biometricInfo,
    handleBiometricAuth: memoizedHandleBiometricAuth,
    setupBiometrics: memoizedSetupBiometrics,
    checkBiometrics: memoizedCheckBiometrics,
    remainingLockoutSeconds,
    lockoutEndTime,
  };
};

export {
  useBiometricAuth,
  BiometryError,
  BiometricAuthOutcome,
  BIOMETRIC_SERVER_KEY,
};
