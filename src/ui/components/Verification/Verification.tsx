import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { i18n } from "../../../i18n";
import { getBiometricsCache } from "../../../store/reducers/biometricsCache";
import { getStateCache } from "../../../store/reducers/stateCache";
import { usePrivacyScreen } from "../../hooks/privacyScreenHook";
import {
  BiometricAuthOutcome,
  useBiometricAuth,
} from "../../hooks/useBiometricsHook";
import { showError } from "../../utils/error";
import { Alert } from "../Alert";
import { VerifyPasscode } from "../VerifyPasscode";
import { VerifyPassword } from "../VerifyPassword";
import { VerifyProps } from "./Verification.types";

const Verification = ({
  verifyIsOpen,
  setVerifyIsOpen,
  onVerify,
}: VerifyProps) => {
  const [showMaxAttemptsAlert, setShowMaxAttemptsAlert] = useState(false);
  const [showPermanentLockoutAlert, setShowPermanentLockoutAlert] =
    useState(false);

  const stateCache = useSelector(getStateCache);
  const biometrics = useSelector(getBiometricsCache);
  const authentication = stateCache.authentication;
  const {
    handleBiometricAuth,
    remainingLockoutSeconds,
    lockoutEndTime,
    isInBiometricProcess,
  } = useBiometricAuth();
  const { disablePrivacy, enablePrivacy } = usePrivacyScreen();

  useEffect(() => {
    if (!lockoutEndTime && showMaxAttemptsAlert) {
      setShowMaxAttemptsAlert(false);
    }
  }, [lockoutEndTime, showMaxAttemptsAlert]);

  const handleBiometrics = async () => {
    if (isInBiometricProcess) return;

    try {
      await disablePrivacy();
      const authenResult = await handleBiometricAuth();

      switch (authenResult) {
        case BiometricAuthOutcome.SUCCESS:
          onVerify();
          setVerifyIsOpen(false);
          break;
        case BiometricAuthOutcome.TEMPORARY_LOCKOUT:
          setShowMaxAttemptsAlert(true);
          break;
        case BiometricAuthOutcome.PERMANENT_LOCKOUT:
          setShowPermanentLockoutAlert(true);
          break;
        case BiometricAuthOutcome.NOT_AVAILABLE:
        case BiometricAuthOutcome.GENERIC_ERROR:
        case BiometricAuthOutcome.USER_CANCELLED:
        default:
          break;
      }
    } catch (e) {
      showError("Failed to biometric auth", e);
    } finally {
      await enablePrivacy();
    }
  };

  useEffect(() => {
    if (biometrics.enabled && verifyIsOpen) {
      handleBiometrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometrics.enabled, verifyIsOpen]);

  return (
    <>
      <VerifyPassword
        isOpen={verifyIsOpen && authentication.passwordIsSet}
        setIsOpen={setVerifyIsOpen}
        onVerify={onVerify}
      />
      <VerifyPasscode
        isOpen={verifyIsOpen && !authentication.passwordIsSet}
        setIsOpen={setVerifyIsOpen}
        onVerify={onVerify}
      />
      <Alert
        isOpen={showMaxAttemptsAlert}
        setIsOpen={setShowMaxAttemptsAlert}
        dataTestId="alert-max-attempts"
        headerText={`${i18n.t("biometry.lockoutheader", {
          seconds: remainingLockoutSeconds,
        })}`}
        confirmButtonText={`${i18n.t("biometry.lockoutconfirm")}`}
        actionConfirm={() => setShowMaxAttemptsAlert(false)}
        backdropDismiss={false}
        className="force-on-top"
      />
      <Alert
        isOpen={showPermanentLockoutAlert}
        setIsOpen={setShowPermanentLockoutAlert}
        dataTestId="alert-permanent-lockout"
        headerText={`${i18n.t("biometry.permanentlockoutheader")}`}
        confirmButtonText={`${i18n.t("biometry.lockoutconfirm")}`}
        actionConfirm={() => setShowPermanentLockoutAlert(false)}
        backdropDismiss={false}
        className="force-on-top"
      />
    </>
  );
};

export { Verification };
