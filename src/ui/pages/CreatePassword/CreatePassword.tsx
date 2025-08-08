import { useRef, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getStateCache,
  setCurrentOperation,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { PasswordModule } from "../../components/PasswordModule";
import { PasswordModuleRef } from "../../components/PasswordModule/PasswordModule.types";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { OperationType, ToastMsgType } from "../../globals/types";
import { useAppIonRouter } from "../../hooks";
import { showError } from "../../utils/error";
import "./CreatePassword.scss";
import { CreatePasswordProps } from "./CreatePassword.types";
import { PageFooter } from "../../components/PageFooter";
import { IonIcon } from "@ionic/react";
import { lockClosedOutline } from "ionicons/icons";

const CreatePassword = ({
  handleClear,
  setPasswordIsSet,
  userAction,
}: CreatePasswordProps) => {
  const pageId = "create-password";
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const ionRouter = useAppIonRouter();
  const passwordModuleRef = useRef<PasswordModuleRef>(null);
  const [alertCancelIsOpen, setAlertCancelIsOpen] = useState(false);
  const isOnboarding = stateCache.routes[0]?.path === RoutePath.CREATE_PASSWORD;
  const [step, setStep] = useState(isOnboarding ? 0 : 1);
  const [validated, setValidated] = useState(false);

  const handleContinue = async (skipped: boolean) => {
    if (skipped) {
      await Agent.agent.basicStorage
        .createOrUpdateBasicRecord(
          new BasicRecord({
            id: MiscRecordId.APP_PASSWORD_SKIPPED,
            content: { value: skipped },
          })
        )
        .catch((e) => {
          showError("Unable to skip set password", e, dispatch);
        });
    }

    if (!isOnboarding) {
      setPasswordIsSet(true);
      userAction?.current === "change" &&
        dispatch(setToastMsg(ToastMsgType.PASSWORD_UPDATED));
      userAction?.current === "enable" &&
        dispatch(setToastMsg(ToastMsgType.PASSWORD_CREATED));
      handleClear();
    } else {
      const { nextPath, updateRedux } = getNextRoute(
        RoutePath.CREATE_PASSWORD,
        {
          store: { stateCache },
          state: { skipped },
        }
      );

      updateReduxState(
        nextPath.pathname,
        {
          store: { stateCache },
          state: { skipped },
        },
        dispatch,
        updateRedux
      );
      dispatch(setCurrentOperation(OperationType.IDLE));
      ionRouter.push(nextPath.pathname, "forward", "push");
    }
  };

  const handleSetupPassword = () => setStep(1);

  const handleSkip = () => {
    setAlertCancelIsOpen(true);
  };

  return (
    <>
      <ScrollablePageLayout
        pageId={pageId}
        customClass={isOnboarding ? "has-header-skip" : undefined}
        header={
          <PageHeader
            currentPath={isOnboarding ? RoutePath.CREATE_PASSWORD : undefined}
            progressBar={isOnboarding}
            progressBarValue={0.5}
            progressBarBuffer={1}
            closeButton={!isOnboarding}
            closeButtonAction={handleClear}
            closeButtonLabel={`${i18n.t("createpassword.cancel")}`}
            title={
              !isOnboarding
                ? `${i18n.t(
                  userAction?.current === "change"
                    ? "createpassword.change"
                    : "createpassword.title"
                )}`
                : undefined
            }
            actionButton={isOnboarding}
            actionButtonLabel={`${i18n.t("createpassword.button.skip")}`}
            actionButtonAction={handleSkip}
          />
        }
        footer={
          step === 0 ? (
            <PageFooter
              primaryButtonText={`${i18n.t(
                "createpassword.setuppassword.button.enable"
              )}`}
              primaryButtonAction={handleSetupPassword}
              tertiaryButtonText={`${i18n.t(
                "createpassword.setuppassword.button.skip"
              )}`}
              tertiaryButtonAction={handleSkip}
            />
          ) : (
            <PageFooter
              pageId={pageId}
              primaryButtonText={`${i18n.t("createpassword.button.continue")}`}
              primaryButtonAction={() => handleContinue(false)}
              primaryButtonDisabled={!validated}
            />
          )
        }
      >
        {step === 0 ? (
          <div className="setup-password">
            <div className="page-info">
              <IonIcon icon={lockClosedOutline} />
              <h1>{i18n.t("createpassword.setuppassword.title")}</h1>
              <p>{i18n.t("createpassword.setuppassword.description")}</p>
            </div>
          </div>
        ) : (
          <PasswordModule
            ref={passwordModuleRef}
            testId={pageId}
            title={
              isOnboarding ? `${i18n.t("createpassword.title")}` : undefined
            }
            description={`${i18n.t("createpassword.description")}`}
            onCreateSuccess={handleContinue}
          />
        )}
      </ScrollablePageLayout>
      <Alert
        isOpen={alertCancelIsOpen}
        setIsOpen={setAlertCancelIsOpen}
        dataTestId="create-password-alert-skip"
        headerText={`${i18n.t("createpassword.alert.text")}`}
        confirmButtonText={`${i18n.t("createpassword.alert.button.confirm")}`}
        cancelButtonText={`${i18n.t("createpassword.alert.button.cancel")}`}
        actionConfirm={() => handleContinue(true)}
      />
    </>
  );
};

export { CreatePassword };
