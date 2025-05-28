import {
  BiometryError,
  BiometryErrorType,
} from "@aparajita/capacitor-biometric-auth";
import { Capacitor } from "@capacitor/core";
import { IonIcon } from "@ionic/react";
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
import { useBiometricAuth } from "../../hooks/useBiometricsHook";
import "./SetupBiometrics.scss";

const SetupBiometrics = () => {
  const pageId = "set-biometrics";
  const ionRouter = useAppIonRouter();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const [showCancelBiometricsAlert, setShowCancelBiometricsAlert] =
    useState(false);

  const setupBiometricsConfirmtext = i18n.t("biometry.setupbiometryconfirm");
  const cancelBiometricsHeaderText = i18n.t("biometry.cancelbiometryheader");
  const cancelBiometricsConfirmText = setupBiometricsConfirmtext;

  const { enablePrivacy, disablePrivacy } = usePrivacyScreen();
  const { handleBiometricAuth } = useBiometricAuth();

  const navToNextStep = async () => {
    await Agent.agent.basicStorage
      .save({
        id: MiscRecordId.BIOMETRICS_SETUP,
        content: {
          value: true,
        },
      })
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
    let isBiometricAuthenticated: boolean | BiometryError = false;
    if (!Capacitor.isNativePlatform()) {
      navToNextStep();
      return;
    }

    try {
      await disablePrivacy();
      isBiometricAuthenticated = await handleBiometricAuth();
    } finally {
      await enablePrivacy();
    }

    if (isBiometricAuthenticated === true) {
      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.APP_BIOMETRY,
          content: { enabled: true },
        })
      );
      dispatch(setEnableBiometricsCache(true));
      dispatch(
        setToastMsg(ToastMsgType.SETUP_BIOMETRIC_AUTHENTICATION_SUCCESS)
      );
      navToNextStep();
    } else if (isBiometricAuthenticated instanceof BiometryError) {
      if (
        isBiometricAuthenticated.code === BiometryErrorType.userCancel ||
        isBiometricAuthenticated.code === BiometryErrorType.biometryNotAvailable
      ) {
        setShowCancelBiometricsAlert(true);
      }
    }
  };

  const skip = () => {
    navToNextStep();
  };

  const handleCancelBiometrics = () => {
    navToNextStep();
  };

  return (
    <>
      <ResponsivePageLayout
        pageId={pageId}
        header={<PageHeader currentPath={RoutePath.SETUP_BIOMETRICS} />}
      >
        <div className="page-info">
          <IonIcon icon={fingerPrintOutline} />
          <h1>{i18n.t("setupbiometrics.title")}</h1>
          <p>{i18n.t("setupbiometrics.description")}</p>
        </div>
        <PageFooter
          primaryButtonText={`${i18n.t("setupbiometrics.button.enable")}`}
          primaryButtonAction={processBiometrics}
          tertiaryButtonText={`${i18n.t("setupbiometrics.button.skip")}`}
          tertiaryButtonAction={skip}
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
    </>
  );
};

export { SetupBiometrics };
