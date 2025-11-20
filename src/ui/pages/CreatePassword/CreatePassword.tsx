import { IonIcon } from "@ionic/react";
import { lockClosedOutline } from "ionicons/icons";
import { useRef, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { KeyStoreKeys, SecureStorage } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getStateCache, setToastMsg } from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { Alert } from "../../components/Alert";
import { PageFooter } from "../../components/PageFooter";
import { PageHeader } from "../../components/PageHeader";
import { PasswordModule } from "../../components/PasswordModule";
import { PasswordModuleRef } from "../../components/PasswordModule/PasswordModule.types";
import { ResponsivePageLayout } from "../../components/layout/ResponsivePageLayout";
import { ToastMsgType } from "../../globals/types";
import { useAppIonRouter } from "../../hooks";
import { showError } from "../../utils/error";
import "./CreatePassword.scss";
import { CreatePasswordProps } from "./CreatePassword.types";

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
  const [validPassword, setValidPassword] = useState(false);

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
    } else {
      await passwordModuleRef.current?.savePassword();
    }

    if (!isOnboarding) {
      setPasswordIsSet(true);
      userAction?.current === "change" &&
        dispatch(setToastMsg(ToastMsgType.PASSWORD_UPDATED));
      userAction?.current === "enable" &&
        dispatch(setToastMsg(ToastMsgType.PASSWORD_CREATED));
      handleClear();
    } else {
      try {
        const seedPhraseStore = await Agent.agent.getBranAndMnemonic();
        await SecureStorage.set(
          KeyStoreKeys.SIGNIFY_BRAN,
          seedPhraseStore.bran
        );

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
        ionRouter.push(nextPath.pathname, "forward", "push");
      } catch (e) {
        showError("Unable to save seedphrase", e, dispatch);
      }
    }
  };

  const handleSetupPassword = () => setStep(1);

  const handleSkip = () => {
    setAlertCancelIsOpen(true);
  };

  return (
    <>
      <ResponsivePageLayout
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
            onValidationChange={setValidPassword}
          />
        )}
        {step === 0 ? (
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
            primaryButtonDisabled={!validPassword}
          />
        )}
      </ResponsivePageLayout>
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
