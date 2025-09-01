
import { useBiometricAuth, BiometricAuthOutcome } from "../../hooks/useBiometricsHook";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getBiometricsCache } from "../../../store/reducers/biometricsCache";
import { getStateCache } from "../../../store/reducers/stateCache";
import { usePrivacyScreen } from "../../hooks/privacyScreenHook";
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

      switch (authenResult) {
        case BiometricAuthOutcome.SUCCESS:
          onVerify();
          setVerifyIsOpen(false);
          break;
        case BiometricAuthOutcome.USER_CANCELLED:
          setVerifyIsOpen(false, true);
          break;
        case BiometricAuthOutcome.TEMPORARY_LOCKOUT:
        case BiometricAuthOutcome.PERMANENT_LOCKOUT:
        case BiometricAuthOutcome.WEAK_BIOMETRY:
        case BiometricAuthOutcome.NOT_AVAILABLE:
        case BiometricAuthOutcome.GENERIC_ERROR:
        default:
          setOpenModalAfterBiometricFail(true);
          break;
      }
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
