import {
  AvailableResult,
  BiometricAuthError,
  BiometryType,
  NativeBiometric,
  SetCredentialOptions,
} from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { i18n } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getAuthentication } from "../../store/reducers/stateCache";
import { useActivityTimer } from "../components/AppWrapper/hooks/useActivityTimer";
import { showError } from "../utils/error";

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

const isBiometricPluginError = (
  error: unknown,
): error is { code: BiometricAuthError; message: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
};

const useBiometricAuth = (isLockPage?: boolean) => {
  const dispatch = useAppDispatch();
  const [biometricInfo, setBiometricInfo] = useState<AvailableResult>({
    isAvailable: false,
    biometryType: BiometryType.NONE,
  });
  const { setPauseTimestamp } = useActivityTimer();
  const { passwordIsSet } = useAppSelector(getAuthentication);

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

  const handleBiometricAuth = async (): Promise<boolean | BiometryError> => {
    const { isAvailable, biometryType } = await checkBiometrics();

    if (!isAvailable) {
      return new BiometryError(
        i18n.t("biometry.errors.notAvailable"),
        BiometricAuthError.BIOMETRICS_UNAVAILABLE,
      );
    }

    const isStrongBiometry =
      biometryType === BiometryType.FACE_ID ||
      biometryType === BiometryType.TOUCH_ID ||
      biometryType === BiometryType.FINGERPRINT;

    if (!isStrongBiometry) {
      return new BiometryError(
        i18n.t("biometry.errors.strongBiometricsRequired"),
        BiometricAuthError.BIOMETRICS_UNAVAILABLE,
      );
    }

    try {
      await NativeBiometric.verifyIdentity({
        reason: i18n.t("biometry.reason") as string,
        title: i18n.t("biometry.title") as string,
        subtitle: i18n.t("biometry.subtitle") as string,
        negativeButtonText: i18n.t("biometry.canceltitle") as string,
        fallbackTitle: i18n.t(
          !isLockPage && passwordIsSet
            ? "biometry.iosfallbackpasswordtitle"
            : "biometry.iosfallbacktitle",
        ) as string,
      });

      await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER_KEY,
      });

      setPauseTimestamp(new Date().getTime());
      return true;
    } catch (error) {
      let message = i18n.t("biometry.errors.unknownAuthError");
      let code = BiometricAuthError.UNKNOWN_ERROR;

      if (isBiometricPluginError(error)) {
        code = error.code;
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      return new BiometryError(message, code);
    }
  };

  const setupBiometrics = async () => {
    const { isAvailable, biometryType } = await checkBiometrics();

    if (!isAvailable) {
      return;
    }

    const isStrongBiometry =
      biometryType === BiometryType.FACE_ID ||
      biometryType === BiometryType.TOUCH_ID ||
      biometryType === BiometryType.FINGERPRINT;

    if (!isStrongBiometry) {
      showError(
        i18n.t("biometry.errors.strongBiometricsRequired"),
        new Error("Weak biometry"),
        dispatch,
      );
      return;
    }

    try {
      await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER_KEY,
      });
    } catch (error) {
      try {
        const credOptions: SetCredentialOptions = {
          server: BIOMETRIC_SERVER_KEY,
          username: BIOMETRIC_SERVER_USERNAME,
          password: "",
        };
        await NativeBiometric.setCredentials(credOptions);
      } catch (error) {
        if (error instanceof Error) {
          showError(i18n.t("biometry.errors.setupFailed"), error, dispatch);
        }
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
    // isStrongBiometryAvailable
  };
};

export { useBiometricAuth, BiometryError };
