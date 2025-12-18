import { Capacitor } from "@capacitor/core";
import { getPlatforms, IonIcon } from "@ionic/react";
import {
  AndroidSettings,
  IOSSettings,
  NativeSettings,
} from "capacitor-native-settings";
import { fingerPrintOutline } from "ionicons/icons";
import { useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { DataProps } from "../../../routes/nextRoute/nextRoute.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setEnableBiometricsCache } from "../../../store/reducers/biometricsCache";
import {
  getStateCache,
  setToastMsg,
  showGenericError,
} from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { Alert } from "../../components/Alert";
import { PageFooter } from "../../components/PageFooter";
import { PageHeader } from "../../components/PageHeader";
import { ResponsivePageLayout } from "../../components/layout/ResponsivePageLayout";
import { ToastMsgType } from "../../globals/types";
import { useAppIonRouter } from "../../hooks";
import { usePrivacyScreen } from "../../hooks/privacyScreenHook";
import {
  BiometricAuthOutcome,
  useBiometricAuth,
} from "../../hooks/useBiometricsHook";
import "./SetupBiometrics.scss";

const SetupBiometrics = () => {
  const pageId = "set-biometrics";
  const ionRouter = useAppIonRouter();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const [showCancelBiometricsAlert, setShowCancelBiometricsAlert] =
    useState(false);
  const [showBiometricsNotAvailable, setShowBiometricsNotAvailable] =
    useState(false);
  const [showSetupBiometricsAlert, setShowSetupBiometricsAlert] =
    useState(false);
  const [showGenericAlert, setShowGenericAlert] = useState(false);
  const [openBiometricAndroidAlert, setOpenBiometricAndroidAlert] =
    useState(false);
  const { enablePrivacy, disablePrivacy } = usePrivacyScreen();
  const { setupBiometrics } = useBiometricAuth();

  const isAndroid = getPlatforms().includes("android");

  const handleSetupSuccess = async () => {
    await Agent.agent.basicStorage.createOrUpdateBasicRecord(
      new BasicRecord({
        id: MiscRecordId.APP_BIOMETRY,
        content: { enabled: true },
      })
    );
    dispatch(setEnableBiometricsCache(true));
    dispatch(setToastMsg(ToastMsgType.SETUP_BIOMETRIC_AUTHENTICATION_SUCCESS));
    navToNextStep();
  };

  const navToNextStep = async () => {
    await Agent.agent.basicStorage
      .createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.BIOMETRICS_SETUP,
          content: { value: true },
        })
      )
      .then(() => {
        const data: DataProps = {
          store: {
            stateCache: {
              ...stateCache,
              authentication: {
                ...stateCache.authentication,
                finishSetupBiometrics: true,
              },
            },
          },
          state: {
            finishedSetup: true,
          },
        };
        const { nextPath, updateRedux } = getNextRoute(
          RoutePath.SETUP_BIOMETRICS,
          data
        );
        updateReduxState(nextPath.pathname, data, dispatch, updateRedux);
        ionRouter.push(nextPath.pathname, "forward", "push");
      })
      .catch((e) => {
        dispatch(showGenericError(true));
        throw e;
      });
  };

  const processBiometrics = async () => {
    let biometricOutcome: BiometricAuthOutcome;
    if (!Capacitor.isNativePlatform()) {
      navToNextStep();
      return;
    }

    try {
      await disablePrivacy();
      biometricOutcome = await setupBiometrics();
    } catch (error) {
      dispatch(showGenericError(true));
      throw error;
    } finally {
      await enablePrivacy();
    }

    if (biometricOutcome === BiometricAuthOutcome.SUCCESS) {
      await handleSetupSuccess();
      return;
    }

    if (isAndroid) {
      switch (biometricOutcome) {
        case BiometricAuthOutcome.PERMANENT_LOCKOUT:
        case BiometricAuthOutcome.TEMPORARY_LOCKOUT:
          setShowBiometricsNotAvailable(true);
          break;
        case BiometricAuthOutcome.NOT_AVAILABLE:
          setOpenBiometricAndroidAlert(true);
          break;
        case BiometricAuthOutcome.USER_CANCELLED:
        case BiometricAuthOutcome.GENERIC_ERROR:
        default:
          setShowGenericAlert(true);
          break;
      }
    }
  };

  const handleSkip = () => {
    setShowCancelBiometricsAlert(true);
  };

  const handleCancelBiometrics = () => {
    navToNextStep();
  };

  const handleEnableButtonClick = () => {
    if (isAndroid) {
      setShowSetupBiometricsAlert(true);
      return;
    }

    processBiometrics();
  };

  const progressBarValue = stateCache.authentication.recoveryWalletProgress
    ? 0.25
    : 0.33;

  const setupBiometricsHeaderText = i18n.t("biometry.setupbiometryheader");
  const setupBiometricsCanceltext = i18n.t("biometry.setupbiometrycancel");
  const setupBiometricsConfirmtext = i18n.t("biometry.setupbiometryconfirm");
  const cancelBiometricsHeaderText = i18n.t("biometry.cancelbiometryheader");
  const cancelBiometricsConfirmText = setupBiometricsConfirmtext;

  const handleDontAllow = () => {
    setShowSetupBiometricsAlert(false);
    navToNextStep();
  };

  const openSetting = () => {
    NativeSettings.open({
      optionAndroid: AndroidSettings.Security,
      optionIOS: IOSSettings.TouchIdPasscode,
    });
  };

  const closeAlert = () => {
    setOpenBiometricAndroidAlert(false);
  };

  const handleSetupLater = () => {
    navToNextStep();
  };

  return (
    <>
      <ResponsivePageLayout
        pageId={pageId}
        customClass={"has-header-skip"}
        header={
          <PageHeader
            currentPath={RoutePath.SETUP_BIOMETRICS}
            progressBar={true}
            progressBarValue={progressBarValue}
            progressBarBuffer={1}
            actionButton={true}
            actionButtonLabel={`${i18n.t("createpassword.button.skip")}`}
            actionButtonAction={handleSkip}
          />
        }
      >
        <div className="page-info">
          <IonIcon icon={fingerPrintOutline} />
          <h1>{i18n.t("setupbiometrics.title")}</h1>
          <p>{i18n.t("setupbiometrics.description")}</p>
        </div>
        <PageFooter
          primaryButtonText={`${i18n.t("setupbiometrics.button.enable")}`}
          primaryButtonAction={handleEnableButtonClick}
          tertiaryButtonText={`${i18n.t("setupbiometrics.button.skip")}`}
          tertiaryButtonAction={handleSkip}
        />
      </ResponsivePageLayout>
      <Alert
        isOpen={showCancelBiometricsAlert}
        setIsOpen={setShowCancelBiometricsAlert}
        dataTestId="alert-cancel-biometry"
        headerText={cancelBiometricsHeaderText}
        confirmButtonText={cancelBiometricsConfirmText}
        actionConfirm={handleCancelBiometrics}
        backdropDismiss={false}
      />
      <Alert
        isOpen={showBiometricsNotAvailable}
        setIsOpen={setShowBiometricsNotAvailable}
        dataTestId="alert-unavailable-error"
        headerText={`${i18n.t("biometry.biometryunavailable")}`}
        confirmButtonText={`${i18n.t("biometry.biometryunavailableconfirm")}`}
        actionConfirm={handleCancelBiometrics}
        backdropDismiss={false}
      />
      <Alert
        isOpen={showGenericAlert}
        setIsOpen={setShowGenericAlert}
        dataTestId="alert-generic-error"
        headerText={`${i18n.t("biometry.biometricsetupretry")}`}
        confirmButtonText={`${i18n.t("biometry.biometryunavailableconfirm")}`}
        actionConfirm={processBiometrics}
        secondaryConfirmButtonText={`${i18n.t("biometry.setuplater")}`}
        actionSecondaryConfirm={handleCancelBiometrics}
        backdropDismiss={false}
      />
      <Alert
        isOpen={showSetupBiometricsAlert}
        setIsOpen={setShowSetupBiometricsAlert}
        dataTestId="alert-setup-biometry"
        headerText={setupBiometricsHeaderText}
        confirmButtonText={setupBiometricsConfirmtext}
        cancelButtonText={setupBiometricsCanceltext}
        actionConfirm={processBiometrics}
        actionCancel={handleDontAllow}
        backdropDismiss={false}
      />
      <Alert
        isOpen={openBiometricAndroidAlert}
        setIsOpen={setOpenBiometricAndroidAlert}
        dataTestId="biometric-enable-alert"
        headerText={i18n.t(
          "settings.sections.security.biometricsalert.message"
        )}
        confirmButtonText={`${i18n.t(
          "settings.sections.security.biometricsalert.ok"
        )}`}
        secondaryConfirmButtonText={`${i18n.t(
          "settings.sections.security.biometricsalert.cancel"
        )}`}
        actionConfirm={openSetting}
        actionSecondaryConfirm={handleSetupLater}
        actionDismiss={closeAlert}
      />
    </>
  );
};

export { SetupBiometrics };
