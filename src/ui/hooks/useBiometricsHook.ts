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


const BIOMETRIC_SERVER_NAME = "com.veridianwallet.biometrics.key";

interface BiometricInfo {
  isAvailable: boolean;
  biometryType?: BiometryType;
}

const useBiometricAuth = (isLockPage?: boolean) => {
  const dispatch = useAppDispatch();
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    isAvailable: false,
  });
  const { setPauseTimestamp } = useActivityTimer();
  const { passwordIsSet } = useAppSelector(getAuthentication);

  const checkBiometrics = async () => {
    const biometricResult: AvailableResult = await NativeBiometric.isAvailable();
    setBiometricInfo(biometricResult);
    return biometricResult;
  };

  useEffect(() => {
    checkBiometrics();
  }, []);

  const handleBiometricAuth = async (): Promise<boolean> => {
    const { isAvailable, errorCode } = await checkBiometrics();
    if (!isAvailable) {
      // TODO
    }
     
    try {
      await NativeBiometric.verifyIdentity({
        reason: i18n.t("biometry.reason") as string,
        title: i18n.t("biometry.title") as string,
        subtitle: i18n.t("biometry.title") as string,
        description: i18n.t("biometry.title") as string,
        negativeButtonText: i18n.t("biometry.canceltitle") as string
      });

      await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER_NAME,
      });

      setPauseTimestamp(new Date().getTime());
      return true;
    } catch (error) {
      if (error instanceof Error) {
        return new Error(error.message, error.errorCode);
      }
      return new BiometryError(`${error}`, "none");
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

export { BiometryError, useBiometricAuth };
