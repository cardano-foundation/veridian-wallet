import {
  BiometryError,
  BiometryErrorType,
} from "@aparajita/capacitor-biometric-auth";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getBiometricsCache } from "../../../store/reducers/biometricsCache";
import { getStateCache } from "../../../store/reducers/stateCache";
import { usePrivacyScreen } from "../../hooks/privacyScreenHook";
import { useBiometricAuth } from "../../hooks/useBiometricsHook";
import { showError } from "../../utils/error";
import { VerifyPasscode } from "../VerifyPasscode";
import { VerifyPassword } from "../VerifyPassword";
import { VerifyProps } from "./Verification.types";

const Verification = ({
  verifyIsOpen,
  setVerifyIsOpen,
  onVerify,
}: VerifyProps) => {
  const [openModalAfterBiometricFail, setOpenModalAfterBiometricFail] =
    useState(false);
  const stateCache = useSelector(getStateCache);
  const biometrics = useSelector(getBiometricsCache);
  const authentication = stateCache.authentication;
  const { handleBiometricAuth } = useBiometricAuth();
  const { disablePrivacy, enablePrivacy } = usePrivacyScreen();

  const canOpenModal =
    verifyIsOpen && (!biometrics.enabled || openModalAfterBiometricFail);

  const handleBiometrics = async () => {
    try {
      await disablePrivacy();
      const authenResult = await handleBiometricAuth();

      if (authenResult === false) {
        setOpenModalAfterBiometricFail(true);
        return;
      }

      if (authenResult instanceof BiometryError) {
        if (
          authenResult.code === BiometryErrorType.userCancel ||
          authenResult.code === BiometryErrorType.appCancel
        ) {
          setVerifyIsOpen(false, true);
          return;
        }

        setOpenModalAfterBiometricFail(true);
        return;
      }

      onVerify();
      setVerifyIsOpen(false);
    } catch (e) {
      showError("Failed to biometric auth", e);
    } finally {
      await enablePrivacy();
    }
  };

  useEffect(() => {
    if (biometrics.enabled && !openModalAfterBiometricFail && verifyIsOpen) {
      handleBiometrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometrics.enabled, openModalAfterBiometricFail, verifyIsOpen]);

  useEffect(() => {
    if (!verifyIsOpen) {
      setOpenModalAfterBiometricFail(false);
    }
  }, [verifyIsOpen]);

  return (
    canOpenModal &&
    (authentication.passwordIsSet ? (
      <VerifyPassword
        isOpen={verifyIsOpen}
        setIsOpen={setVerifyIsOpen}
        onVerify={onVerify}
      />
    ) : (
      <VerifyPasscode
        isOpen={verifyIsOpen}
        setIsOpen={setVerifyIsOpen}
        onVerify={onVerify}
      />
    ))
  );
};

export { Verification };
