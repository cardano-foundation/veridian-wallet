import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
} from "@aparajita/capacitor-biometric-auth";
import {
  AndroidBiometryStrength,
  CheckBiometryResult,
} from "@aparajita/capacitor-biometric-auth/dist/esm/definitions";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { useEffect, useState } from "react";
import { i18n } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getAuthentication } from "../../store/reducers/stateCache";
import { useActivityTimer } from "../components/AppWrapper/hooks/useActivityTimer";
import { showError } from "../utils/error";

const useBiometricAuth = (isLockPage?: boolean) => {
  const dispatch = useAppDispatch();
  const [biometricInfo, setBiometricInfo] = useState<CheckBiometryResult>();
  const { setPauseTimestamp } = useActivityTimer();
  const { passwordIsSet } = useAppSelector(getAuthentication);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      checkBiometrics();
    }
  }, []);

  useEffect(() => {
    let appListener: PluginListenerHandle;

    const updateBiometrics = async () => {
      try {
        appListener = await BiometricAuth.addResumeListener(setBiometricInfo);
      } catch (error) {
        if (error instanceof Error) {
          showError("Unable to add biometric event", error, dispatch);
        }
      }
    };
    updateBiometrics();

    return () => {
      appListener?.remove();
    };
  }, [dispatch]);

  const checkBiometrics = async () => {
    const biometricResult = await BiometricAuth.checkBiometry();
    setBiometricInfo(biometricResult);
    return biometricResult;
  };

  const handleBiometricAuth = async (): Promise<boolean | BiometryError> => {
    const biometricResult = await checkBiometrics();

    if (!biometricResult?.strongBiometryIsAvailable) {
      return new BiometryError(
        "Biometry too weak",
        BiometryErrorType.biometryNotAvailable
      );
    } else if (!biometricResult?.isAvailable) {
      return new BiometryError(
        "Biometry not available",
        BiometryErrorType.biometryNotAvailable
      );
    }

    try {
      await BiometricAuth.authenticate({
        reason: i18n.t("biometry.reason") as string,
        cancelTitle: i18n.t("biometry.canceltitle") as string,
        iosFallbackTitle: i18n.t(
          !isLockPage && passwordIsSet
            ? "biometry.iosfallbackpasswordtitle"
            : "biometry.iosfallbacktitle"
        ) as string,
        androidTitle: i18n.t("biometry.androidtitle") as string,
        androidSubtitle: i18n.t("biometry.androidsubtitle") as string,
        androidConfirmationRequired: false,
        androidBiometryStrength: AndroidBiometryStrength.strong,
      });

      setPauseTimestamp(new Date().getTime());
      return true;
    } catch (error) {
      if (error instanceof BiometryError) {
        return error;
      }
      return new BiometryError(`${error}`, BiometryErrorType.none);
    }
  };

  return {
    biometricInfo,
    handleBiometricAuth,
  };
};

export { useBiometricAuth };
