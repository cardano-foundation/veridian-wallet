import { IonModal } from "@ionic/react";
import { useRef, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { KeyStoreKeys, SecureStorage } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getStateCache,
  setAuthentication,
} from "../../../store/reducers/stateCache";
import { BackEventPriorityType } from "../../globals/types";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { Alert } from "../Alert";
import { CreatePasscodeModule } from "../CreatePasscodeModule";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import { PasswordModule } from "../PasswordModule";
import { PasswordModuleRef } from "../PasswordModule/PasswordModule.types";
import {
  RecoverySeedPhraseModule,
  RecoverySeedPhraseModuleRef,
} from "../RecoverySeedPhraseModule";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import "./ForgotAuthInfo.scss";
import { ForgotAuthInfoProps, ForgotType } from "./ForgotAuthInfo.types";

const ForgotAuthInfo = ({
  isOpen,
  type,
  overrideAlertZIndex,
  onClose,
}: ForgotAuthInfoProps) => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(getStateCache).authentication;
  const pageId = "forgot-auth-info-modal";
  const recoverySeedId = "forgot-auth-info";
  const [step, setStep] = useState(0);
  const [reEnterPasscodeStep, setReEnterPasscodeStep] = useState(true);
  const [validPassword, setValidPassword] = useState(false);
  const [alertCancelIsOpen, setAlertCancelIsOpen] = useState(false);
  const passwordModuleRef = useRef<PasswordModuleRef>(null);

  const ref = useRef<RecoverySeedPhraseModuleRef>(null);

  const handleClearState = () => {
    ref.current?.clearState();
    setStep(0);
    setReEnterPasscodeStep(false);
  };

  const handleAfterVerifySeedPhrase = () => {
    setStep(1);
  };

  const handleClose = (shouldCloseParents?: boolean) => {
    handleClearState();
    onClose(shouldCloseParents);
  };

  const handleCreatePassword = async () => {
    await passwordModuleRef.current?.savePassword();

    dispatch(
      setAuthentication({
        ...auth,
        passwordIsSet: true,
      })
    );

    handleClose();
  };

  const pageTitle = (() => {
    if (step === 0) {
      return type === ForgotType.Passcode
        ? "forgotauth.passcode.title"
        : "forgotauth.password.title";
    }

    return type === ForgotType.Passcode
      ? reEnterPasscodeStep
        ? "forgotauth.newpasscode.reenterpasscode"
        : "forgotauth.newpasscode.title"
      : "forgotauth.newpassword.title";
  })();

  const seedPhraseDescription =
    type === ForgotType.Passcode
      ? "forgotauth.passcode.description"
      : "forgotauth.password.description";

  const skip = async () => {
    if (!isSetupPasswordScreen) return;

    try {
      await SecureStorage.delete(KeyStoreKeys.APP_OP_PASSWORD);
      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.APP_PASSWORD_SKIPPED,
          content: { value: true },
        })
      );

      handleClose();

      setTimeout(() => {
        dispatch(
          setAuthentication({
            ...auth,
            passwordIsSet: false,
            passwordIsSkipped: true,
          })
        );
      }, 300);
    } catch (e) {
      showError("Unable to delete password", e, dispatch);
    }
  };

  const isSetupPasswordScreen = step !== 0 && type === ForgotType.Password;

  return (
    <>
      <IonModal
        isOpen={isOpen}
        className={combineClassNames(pageId, {
          "max-zindex": !!overrideAlertZIndex,
        })}
        data-testid={pageId}
        onDidDismiss={() => handleClose()}
      >
        <ScrollablePageLayout
          pageId={pageId}
          activeStatus={isOpen}
          header={
            <PageHeader
              closeButton={true}
              closeButtonLabel={`${i18n.t("forgotauth.cancel")}`}
              closeButtonAction={handleClose}
              title={`${i18n.t(pageTitle)}`}
              actionButton
              actionButtonLabel={
                isSetupPasswordScreen
                  ? `${i18n.t("forgotauth.newpassword.skip")}`
                  : undefined
              }
              actionButtonAction={() => setAlertCancelIsOpen(true)}
              hardwareBackButtonConfig={{
                prevent: false,
                priority: BackEventPriorityType.Modal,
              }}
            />
          }
          footer={
            isSetupPasswordScreen && (
              <PageFooter
                primaryButtonText={`${i18n.t(
                  "createpassword.button.continue"
                )}`}
                primaryButtonAction={handleCreatePassword}
                primaryButtonDisabled={!validPassword}
              />
            )
          }
        >
          {step === 0 ? (
            <RecoverySeedPhraseModule
              description={`${i18n.t(seedPhraseDescription)}`}
              ref={ref}
              testId={recoverySeedId}
              onVerifySuccess={handleAfterVerifySeedPhrase}
              overrideAlertZIndex={overrideAlertZIndex}
            />
          ) : type === ForgotType.Passcode ? (
            <CreatePasscodeModule
              description={`${i18n.t("forgotauth.newpasscode.description")}`}
              testId={pageId}
              onPasscodeChange={(passcode, originalPassCode) => {
                setReEnterPasscodeStep(!!originalPassCode);
              }}
              onCreateSuccess={handleClose}
              overrideAlertZIndex={overrideAlertZIndex}
              changePasscodeMode
            />
          ) : (
            <PasswordModule
              testId={pageId}
              description={`${i18n.t("forgotauth.newpassword.description")}`}
              ref={passwordModuleRef}
              onValidationChange={setValidPassword}
            />
          )}
        </ScrollablePageLayout>
      </IonModal>
      <Alert
        isOpen={alertCancelIsOpen}
        setIsOpen={setAlertCancelIsOpen}
        dataTestId="forgot-password-alert-skip"
        headerText={`${i18n.t("forgotauth.newpassword.alert.text")}`}
        confirmButtonText={`${i18n.t(
          "forgotauth.newpassword.alert.button.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "forgotauth.newpassword.alert.button.cancel"
        )}`}
        actionConfirm={skip}
      />
    </>
  );
};

export { ForgotAuthInfo };
