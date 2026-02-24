import { IonModal } from "@ionic/react";
import { useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { i18n } from "../../../i18n";
import { RecoverySeedPhrase } from "../../components/Settings/components/RecoverySeedPhrase";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import {
  Step,
  VerifySeedPhraseModalProps,
} from "./VerifySeedPhraseModal.types";
import { VerifyStage } from "./VerifyStage";

const VerifySeedPhraseModal = ({
  setShow,
  show,
  onVerifySuccess,
  showCancel = true,
}: VerifySeedPhraseModalProps) => {
  const [step, setStep] = useState<Step>(Step.View);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const pageId = step == Step.View ? "view-seedphrase" : "verify-seedphrase";

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      setStep(Step.View);
    }, 100);
  };

  const startVerify = (seedPhrase: string[]) => {
    setSeedPhrase(seedPhrase);
    setStep(Step.Verify);
  };

  const verifySuccess = async () => {
    try {
      await Agent.agent.markSeedPhraseAsVerified();

      handleClose();
      onVerifySuccess();
    } catch (e) {
      showError("Failed to verify state", e);
    }
  };

  const handleCloseButtonClick = () => {
    return step === Step.View ? handleClose() : setStep(Step.View);
  };

  const getContent = () => {
    switch (step) {
      case Step.Verify:
        return (
          <VerifyStage
            onVerifySuccess={verifySuccess}
            seedPhrase={seedPhrase}
            handleClose={handleClose}
            pageId={pageId}
          />
        );
      default:
        return (
          <RecoverySeedPhrase
            title={i18n.t("verifyseedphrase.title.recovery")}
            onClose={handleClose}
            mode="verify"
            starVerify={startVerify}
            pageId={pageId}
            showCloseButton={showCancel}
          />
        );
    }
  };

  return (
    <IonModal
      className={combineClassNames("verify-seedphrase", {
        "not-dismiss": !showCancel,
      })}
      isOpen={show}
      onDidDismiss={handleCloseButtonClick}
    >
      {getContent()}
    </IonModal>
  );
};

export { VerifySeedPhraseModal };
