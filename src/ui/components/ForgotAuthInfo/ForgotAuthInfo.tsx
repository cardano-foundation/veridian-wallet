import { IonModal } from "@ionic/react";
import { useState } from "react";
import { CreatePassword } from "../../pages/CreatePassword";
import { combineClassNames } from "../../utils/style";
import { ChangePinPage } from "../Settings/components/ChangePin";
import "./ForgotAuthInfo.scss";
import { ForgotAuthInfoProps, ForgotType } from "./ForgotAuthInfo.types";
import { VerifySeedPhrase } from "./VerifySeedPhrase";

const ForgotAuthInfo = ({
  isOpen,
  type,
  overrideAlertZIndex,
  onClose,
}: ForgotAuthInfoProps) => {
  const pageId = "forgot-auth-info-modal";
  const [step, setStep] = useState(0);

  const handleClearState = () => {
    setStep(0);
  };

  const handleClose = (shouldCloseParents?: boolean) => {
    handleClearState();
    onClose(shouldCloseParents);
  };

  const getContent = () => {
    if (step == 0) {
      return (
        <VerifySeedPhrase
          onVerifySuccess={() => setStep(1)}
          onCancel={onClose}
          type={type}
          overrideAlertZIndex={overrideAlertZIndex}
        />
      );
    }

    if (type === ForgotType.Passcode) {
      return (
        <ChangePinPage
          pageId={pageId}
          onCancel={handleClose}
          overrideAlertZIndex={overrideAlertZIndex}
        />
      );
    }

    return (
      <CreatePassword
        userAction={{ current: "change" }}
        handleClear={() => handleClose(true)}
        showSkip
      />
    );
  };

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
        {getContent()}
      </IonModal>
    </>
  );
};

export { ForgotAuthInfo };
