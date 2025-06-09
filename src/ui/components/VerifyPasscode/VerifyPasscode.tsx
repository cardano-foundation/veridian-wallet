import { IonModal } from "@ionic/react";
import { useEffect, useState } from "react";
import { i18n } from "../../../i18n";
import { Alert } from "../Alert";
import { ErrorMessage, MESSAGE_MILLISECONDS } from "../ErrorMessage";
import { ForgotAuthInfo } from "../ForgotAuthInfo";
import { ForgotType } from "../ForgotAuthInfo/ForgotAuthInfo.types";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import { PasscodeModule } from "../PasscodeModule";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import "./VerifyPasscode.scss";
import { VerifyPasscodeProps } from "./VerifyPasscode.types";
import { Agent } from "../../../core/agent/agent";
import { KeyStoreKeys } from "../../../core/storage";

const VerifyPasscode = ({
  isOpen,
  setIsOpen,
  onVerify,
}: VerifyPasscodeProps) => {
  const componentId = "verify-passcode";
  const [passcode, setPasscode] = useState("");
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [passcodeIncorrect, setPasscodeIncorrect] = useState(false);
  const [openRecoveryAuth, setOpenRecoveryAuth] = useState(false);

  const headerText = i18n.t("verifypasscode.alert.text.verify");
  const confirmButtonText = i18n.t("verifypasscode.alert.button.verify");
  const cancelButtonText = i18n.t("verifypasscode.alert.button.cancel");

  const handleClearState = (isCancel?: boolean) => {
    setPasscode("");
    setAlertIsOpen(false);
    setPasscodeIncorrect(false);
    setIsOpen(false, isCancel);
  };

  const handlePinChange = (digit: number) => {
    if (passcode.length < 6) {
      setPasscode(passcode + digit);
      if (passcode.length === 5) {
        Agent.agent.auth
          .verifySecret(KeyStoreKeys.APP_PASSCODE, passcode + digit)
          .then((verified) => {
            if (verified) {
              onVerify();
              handleClearState();
            } else {
              setPasscodeIncorrect(true);
            }
          })
          .catch((e) => e.code === -35 && setPasscodeIncorrect(true));
      }
    }
  };

  const handleRemove = () => {
    if (passcode.length >= 1) {
      setPasscode(passcode.substring(0, passcode.length - 1));
    }
  };

  useEffect(() => {
    if (passcodeIncorrect) {
      setTimeout(() => {
        setPasscodeIncorrect(false);
        setPasscode("");
      }, MESSAGE_MILLISECONDS);
    }
  }, [passcodeIncorrect]);

  const resetPasscode = () => {
    setOpenRecoveryAuth(true);
  };

  const onClose = () => handleClearState(true);

  return (
    <IonModal
      isOpen={isOpen}
      className={componentId}
      data-testid={componentId}
      onDidDismiss={onClose}
    >
      <ResponsivePageLayout
        activeStatus={isOpen}
        header={
          <PageHeader
            closeButton={true}
            closeButtonLabel={`${i18n.t("verifypasscode.cancel")}`}
            closeButtonAction={onClose}
          />
        }
        pageId={`${componentId}-content`}
      >
        <h2
          className="verify-passcode-title"
          data-testid="verify-passcode-title"
        >
          {i18n.t("verifypasscode.title")}
        </h2>
        <p
          className="verify-passcode-description small-hide"
          data-testid="verify-passcode-description"
        >
          {i18n.t("verifypasscode.description")}
        </p>
        <PasscodeModule
          error={
            <ErrorMessage
              message={
                passcode.length === 6 && passcodeIncorrect
                  ? `${i18n.t("verifypasscode.error")}`
                  : undefined
              }
              timeout={true}
            />
          }
          hasError={passcode.length === 6 && passcodeIncorrect}
          passcode={passcode}
          handlePinChange={handlePinChange}
          handleRemove={handleRemove}
        />
        <PageFooter
          pageId={componentId}
          secondaryButtonText={`${i18n.t("verifypasscode.forgotten.button")}`}
          secondaryButtonAction={() => setAlertIsOpen(true)}
        />
        <Alert
          isOpen={alertIsOpen}
          setIsOpen={setAlertIsOpen}
          dataTestId="alert-forgotten"
          headerText={headerText}
          confirmButtonText={confirmButtonText}
          cancelButtonText={cancelButtonText}
          actionConfirm={resetPasscode}
        />
        <ForgotAuthInfo
          isOpen={openRecoveryAuth}
          onClose={() => setOpenRecoveryAuth(false)}
          type={ForgotType.Passcode}
        />
      </ResponsivePageLayout>
    </IonModal>
  );
};

export { VerifyPasscode };
