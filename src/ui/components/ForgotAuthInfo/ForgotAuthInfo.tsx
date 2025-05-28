import { IonModal } from "@ionic/react";
import { useRef, useState } from "react";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getStateCache,
  setAuthentication,
} from "../../../store/reducers/stateCache";
import { BackEventPriorityType } from "../../globals/types";
import { combineClassNames } from "../../utils/style";
import { CreatePasscodeModule } from "../CreatePasscodeModule";
import { PageHeader } from "../PageHeader";
import { PasswordModule } from "../PasswordModule";
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

  const handleCreatePasswordSuccess = (skipped: boolean) => {
    dispatch(
      setAuthentication({
        ...auth,
        passwordIsSet: true,
        passwordIsSkipped: skipped,
      })
    );

    handleClose(skipped);
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

  return (
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
            hardwareBackButtonConfig={{
              prevent: false,
              priority: BackEventPriorityType.Modal,
            }}
          />
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
            onCreateSuccess={handleCreatePasswordSuccess}
          />
        )}
      </ScrollablePageLayout>
    </IonModal>
  );
};

export { ForgotAuthInfo };
