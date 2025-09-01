import { App, AppState } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { useBiometricAuth, BiometricAuthOutcome } from "../../hooks/useBiometricsHook";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { KeyStoreKeys, SecureStorage } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { PublicRoutes, RoutePath } from "../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getBiometricsCache,
  setEnableBiometricsCache,
} from "../../../store/reducers/biometricsCache";
import {
  getAuthentication,
  getCurrentRoute,
  getFirstAppLaunch,
  login,
  resetAllRoutes,
  setAuthentication,
  setFirstAppLaunchComplete,
  setInitializationPhase,
} from "../../../store/reducers/stateCache";
import { Alert } from "../../components/Alert";
import {
  ErrorMessage,
  MESSAGE_MILLISECONDS,
} from "../../components/ErrorMessage";
import { ForgotAuthInfo } from "../../components/ForgotAuthInfo";
import { ForgotType } from "../../components/ForgotAuthInfo/ForgotAuthInfo.types";
import {
  MaxLoginAttemptAlert,
  useLoginAttempt,
} from "../../components/MaxLoginAttemptAlert";
import { PageFooter } from "../../components/PageFooter";
import { PasscodeModule } from "../../components/PasscodeModule";
import { ResponsivePageLayout } from "../../components/layout/ResponsivePageLayout";
import { BackEventPriorityType } from "../../globals/types";
import { useExitAppWithDoubleTap } from "../../hooks/exitAppWithDoubleTapHook";
import { usePrivacyScreen } from "../../hooks/privacyScreenHook";
import { showError } from "../../utils/error";
import "./LockPage.scss";
import { InitializationPhase } from "../../../store/reducers/stateCache/stateCache.types";

const LockPageContainer = () => {
  const pageId = "lock-page";
  const dispatch = useAppDispatch();
  const [passcode, setPasscode] = useState("");
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [passcodeIncorrect, setPasscodeIncorrect] = useState(false);
  const preventBiometricOnEvent = useRef(false);

  const { handleBiometricAuth } = useBiometricAuth(true);
  const biometricsCache = useSelector(getBiometricsCache);
  const firstAppLaunch = useSelector(getFirstAppLaunch);
  const [openRecoveryAuth, setOpenRecoveryAuth] = useState(false);
  const { enablePrivacy, disablePrivacy } = usePrivacyScreen();
  const authentication = useAppSelector(getAuthentication);
  const router = useHistory();

  const {
    isLock,
    lockDuration,
    errorMessage,
    incrementLoginAttempt,
    resetLoginAttempt,
  } = useLoginAttempt();

  useExitAppWithDoubleTap(
    alertIsOpen || openRecoveryAuth,
    BackEventPriorityType.LockPage
  );

  const headerText = i18n.t("lockpage.alert.text.verify");
  const confirmButtonText = i18n.t("lockpage.alert.button.verify");
  const cancelButtonText = i18n.t("lockpage.alert.button.cancel");

  const handleClearState = () => {
    setAlertIsOpen(false);
    setPasscodeIncorrect(false);
    setPasscode("");
  };

  useEffect(() => {
    if (passcodeIncorrect) {
      setTimeout(() => {
        setPasscodeIncorrect(false);
        setPasscode("");
      }, MESSAGE_MILLISECONDS);
    }
  }, [passcodeIncorrect]);

  useEffect(() => {
    if (firstAppLaunch) {
      handleUseBiometrics();
    }
  }, []);

  const handleUseBiometrics = async () => {
    if (biometricsCache.enabled) {
      await handleBiometrics();
    }
  };

  const handlePinChange = async (digit: number) => {
    const updatedPasscode = `${passcode}${digit}`;

    if (updatedPasscode.length <= 6) setPasscode(updatedPasscode);

    if (updatedPasscode.length === 6) {
      const verified = await Agent.agent.auth.verifySecret(
        KeyStoreKeys.APP_PASSCODE,
        updatedPasscode
      );

      if (verified) {
        await resetLoginAttempt();
        dispatch(login());
        dispatch(setFirstAppLaunchComplete());
        handleClearState();
      } else {
        await incrementLoginAttempt();
        setPasscodeIncorrect(true);
      }
    }
  };

  const handleRemove = () => {
    if (passcode.length >= 1) {
      setPasscode(passcode.substring(0, passcode.length - 1));
    }
  };

  const handleBiometrics = async () => {
    let authenResult: BiometricAuthOutcome;
    try {
      await disablePrivacy();
      authenResult = await handleBiometricAuth();
      preventBiometricOnEvent.current =
        authenResult === BiometricAuthOutcome.USER_CANCELLED ||
        authenResult === BiometricAuthOutcome.SUCCESS;
    } finally {
      await enablePrivacy();
    }

    switch (authenResult) {
      case BiometricAuthOutcome.SUCCESS:
        dispatch(login());
        dispatch(setFirstAppLaunchComplete());
        break;
      case BiometricAuthOutcome.USER_CANCELLED:
        // Do nothing, user cancelled
        break;
      case BiometricAuthOutcome.TEMPORARY_LOCKOUT:
      case BiometricAuthOutcome.PERMANENT_LOCKOUT:
      case BiometricAuthOutcome.WEAK_BIOMETRY:
      case BiometricAuthOutcome.NOT_AVAILABLE:
      case BiometricAuthOutcome.GENERIC_ERROR:
      default:
        // Do nothing
        break;
    }
  };

  const resetPasscode = async () => {
    setOpenRecoveryAuth(true);
  };

  const error = (() => {
    if (!passcodeIncorrect || isLock) return undefined;

    if (errorMessage) return errorMessage;

    if (passcode.length === 6) return `${i18n.t("lockpage.error")}`;

    return undefined;
  })();

  const outFocusAfterLockPage = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      // NOTE: focus to passcode button when open lock page to close keyboard and unfocus any textbox
      Keyboard.hide();
      document.getElementById("passcode-button-1")?.focus();
    }
  }, []);

  useEffect(() => {
    outFocusAfterLockPage();
  }, [outFocusAfterLockPage]);

  useEffect(() => {
    const handleAppStateChange = async (state: AppState) => {
      outFocusAfterLockPage();

      if (state.isActive && !preventBiometricOnEvent.current) {
        handleUseBiometrics();
      }
    };

    const listener = App.addListener("appStateChange", handleAppStateChange);

    return () => {
      listener
        .then((value) => value.remove())
        .catch((e) => showError("Unable to clear listener", e));
    };
  }, []);

  const handleRecoveryButtonClick = async () => {
    if (authentication.seedPhraseIsSet) {
      setAlertIsOpen(true);
      return;
    }

    try {
      await Promise.all([
        SecureStorage.delete(KeyStoreKeys.APP_PASSCODE),
        SecureStorage.delete(KeyStoreKeys.APP_OP_PASSWORD),
      ]);

      await Promise.allSettled([
        Agent.agent.basicStorage.deleteById(MiscRecordId.OP_PASS_HINT),
        Agent.agent.basicStorage.deleteById(MiscRecordId.APP_PASSWORD_SKIPPED),
        Agent.agent.basicStorage.deleteById(MiscRecordId.APP_ALREADY_INIT),
        Agent.agent.basicStorage.deleteById(MiscRecordId.APP_BIOMETRY),
      ]);

      dispatch(
        setAuthentication({
          ...authentication,
          passcodeIsSet: false,
          passwordIsSet: false,
          passwordIsSkipped: false,
          loggedIn: false,
          finishSetupBiometrics: false,
        })
      );
      dispatch(resetAllRoutes());
      dispatch(setEnableBiometricsCache(false));
      dispatch(setInitializationPhase(InitializationPhase.PHASE_TWO));
      router.push(RoutePath.ROOT);
    } catch (e) {
      showError("Failed to clear app: ", e, dispatch);
    }
  };

  return (
    <ResponsivePageLayout
      pageId={pageId}
      activeStatus={true}
      customClass={"show animation-off max-overlay"}
    >
      {isLock ? (
        <MaxLoginAttemptAlert lockDuration={lockDuration} />
      ) : (
        <>
          <h2
            className={`${pageId}-title`}
            data-testid={`${pageId}-title`}
          >
            {i18n.t("lockpage.title")}
          </h2>
          <p
            className={`${pageId}-description small-hide`}
            data-testid={`${pageId}-description`}
          >
            {i18n.t("lockpage.description")}
          </p>
          <PasscodeModule
            error={
              <ErrorMessage
                message={error}
                timeout={true}
                key={error}
              />
            }
            hasError={!!error}
            passcode={passcode}
            handlePinChange={handlePinChange}
            handleRemove={handleRemove}
            handleBiometricButtonClick={() => {
              handleUseBiometrics();
            }}
          />
        </>
      )}
      <PageFooter
        pageId={pageId}
        secondaryButtonText={`${i18n.t("lockpage.forgotten.button")}`}
        secondaryButtonAction={handleRecoveryButtonClick}
      />
      <Alert
        isOpen={alertIsOpen}
        setIsOpen={setAlertIsOpen}
        dataTestId="alert-forgotten"
        headerText={headerText}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        actionConfirm={resetPasscode}
        className="alert-forgotten"
      />
      <ForgotAuthInfo
        isOpen={openRecoveryAuth}
        onClose={() => setOpenRecoveryAuth(false)}
        type={ForgotType.Passcode}
        overrideAlertZIndex
      />
    </ResponsivePageLayout>
  );
};

const LockPage = () => {
  const currentRoute = useAppSelector(getCurrentRoute);
  const authentication = useAppSelector(getAuthentication);
  const isPublicPage = PublicRoutes.includes(currentRoute?.path as RoutePath);

  if (isPublicPage || authentication.loggedIn) {
    return null;
  }

  return <LockPageContainer />;
};

export {
  LockPage
}