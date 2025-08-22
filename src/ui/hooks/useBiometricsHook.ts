import {
  AvailableResult,
  BiometricAuthError,
  BiometryType,
  NativeBiometric,
} from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { i18n } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getAuthentication } from "../../store/reducers/stateCache";
import { useActivityTimer } from "../components/AppWrapper/hooks/useActivityTimer";
import { showError } from "../utils/error";

export class BiometryError extends Error {
  public code: BiometricAuthError;

  constructor(message: string, code: BiometricAuthError) {
    super(message);
    this.name = "BiometryError";
    this.code = code;
  }
}

const BIOMETRIC_SERVER_NAME = "com.veridianwallet.biometrics.key";

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
      const biometricResult:AvailableResult = await NativeBiometric.isAvailable();
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
        "Biometry is not available on this device.",
        BiometricAuthError.BIOMETRICS_UNAVAILABLE,
      );
    }

    const isStrongBiometry =
      biometryType === BiometryType.FACE_ID ||
      biometryType === BiometryType.TOUCH_ID ||
      biometryType === BiometryType.FINGERPRINT;

    if (!isStrongBiometry) {
      return new BiometryError(
        "Only strong biometrics (FaceID, Fingerprint) are allowed.",
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
        server: BIOMETRIC_SERVER_NAME,
      });

      setPauseTimestamp(new Date().getTime());
      return true;
    } catch (error) {
      let message = "An unknown error occurred during biometric authentication.";
      let code = BiometricAuthError.UNKNOWN_ERROR;

      if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        code = (error as any).code;
        message = (error as any).message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      return new BiometryError(message, code);
    }
  };

  const setupBiometrics = async () => {
    try {
      const digitalKey = "veridian_wallet_biometric_key";
      await NativeBiometric.setCredentials({
        server: BIOMETRIC_SERVER_NAME,
        username: "appUnlockKey",
        password: digitalKey,
      });
    } catch (error) {
      if (error instanceof Error) {
        showError("Unable to set up biometrics", error, dispatch);
      }
    }
  };

  return {
    biometricInfo,
    handleBiometricAuth,
    setupBiometrics,
    checkBiometrics,
  };
};

export { useBiometricAuth };
