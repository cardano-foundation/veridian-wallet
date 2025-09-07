
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useBiometricAuth, BiometricAuthOutcome } from "../../hooks/useBiometricsHook";
import { getBiometricsCache } from "../../../store/reducers/biometricsCache";
import { getStateCache } from "../../../store/reducers/stateCache";
import { usePrivacyScreen } from "../../hooks/privacyScreenHook";
import { showError } from "../../utils/error";
import { VerifyPasscode } from "../VerifyPasscode";
import { VerifyPassword } from "../VerifyPassword";
import { VerifyProps } from "./Verification.types";
import { Alert } from "../Alert";
import { i18n } from "../../../i18n";

const Verification = ({
  verifyIsOpen,
  setVerifyIsOpen,
  onVerify,
}: VerifyProps) => {
  const [openModalAfterBiometricFail, setOpenModalAfterBiometricFail] =
    useState(false);
  const [showMaxAttemptsAlert, setShowMaxAttemptsAlert] = useState(false);
  const [showPermanentLockoutAlert, setShowPermanentLockoutAlert] = useState(false);
  
  const stateCache = useSelector(getStateCache);
  const biometrics = useSelector(getBiometricsCache);
  const authentication = stateCache.authentication;
  const { handleBiometricAuth, remainingLockoutSeconds, lockoutEndTime } = useBiometricAuth();
  const { disablePrivacy, enablePrivacy } = usePrivacyScreen();

  const canOpenModal =
    verifyIsOpen && (!biometrics.enabled || openModalAfterBiometricFail);

  useEffect(() => {
    if (!lockoutEndTime && showMaxAttemptsAlert) {
      setShowMaxAttemptsAlert(false);
    }
  }, [lockoutEndTime, showMaxAttemptsAlert]);

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
          setVerifyIsOpen(false);
          break;
        case BiometricAuthOutcome.TEMPORARY_LOCKOUT:
          setShowMaxAttemptsAlert(true);
          break;
        case BiometricAuthOutcome.PERMANENT_LOCKOUT:
          setShowPermanentLockoutAlert(true);
          break;
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

  return (<>{
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
  }
  <Alert
    isOpen={showMaxAttemptsAlert}
    setIsOpen={setShowMaxAttemptsAlert}
    dataTestId="alert-max-attempts"
    headerText={`${i18n.t("biometry.lockoutheader", { seconds: remainingLockoutSeconds })}`}
    confirmButtonText={i18n.t("biometry.lockoutconfirm") as string}
    actionConfirm={() => setShowMaxAttemptsAlert(false)}
    backdropDismiss={false}
    className="force-on-top"
  />
  <Alert
    isOpen={showPermanentLockoutAlert}
    setIsOpen={setShowPermanentLockoutAlert}
    dataTestId="alert-permanent-lockout"
    headerText={i18n.t("biometry.permanentlockoutheader") as string}
    confirmButtonText={i18n.t("biometry.lockoutconfirm") as string}
    actionConfirm={() => setShowPermanentLockoutAlert(false)}
    backdropDismiss={false}
    className="force-on-top"
  />
  </>
  );
};

export { Verification };
