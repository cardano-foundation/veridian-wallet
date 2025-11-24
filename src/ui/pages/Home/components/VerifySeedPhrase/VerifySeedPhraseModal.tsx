import { IonModal } from "@ionic/react";
import { useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { MiscRecordId } from "../../../../../core/agent/agent.types";
import { BasicRecord } from "../../../../../core/agent/records";
import { i18n } from "../../../../../i18n";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../../../components/PageHeader";
import { RecoverySeedPhrase } from "../../../../components/Settings/components/RecoverySeedPhrase";
import { showError } from "../../../../utils/error";
import {
  Step,
  VerifySeedPhraseModalProps,
} from "./VerifySeedPhraseModal.types";
import { VerifyStage } from "./VerifyStage";

const VerifySeedPhraseModal = ({
  setShow,
  show,
  onVerifySuccess,
}: VerifySeedPhraseModalProps) => {
  const [step, setStep] = useState<Step>(Step.View);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);

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
      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.VERIFY_SEEDPHRASE,
          content: {
            value: true,
          },
        })
      );

      handleClose();
      onVerifySuccess();
    } catch (e) {
      showError("Failed to verify state", e);
    }
  };

  const getContent = () => {
    switch (step) {
      case Step.Verify:
        return (
          <VerifyStage
            onVerifySuccess={verifySuccess}
            seedPhrase={seedPhrase}
          />
        );
      default:
        return (
          <RecoverySeedPhrase
            onClose={handleClose}
            mode="verify"
            starVerify={startVerify}
          />
        );
    }
  };

  const handleCloseButtonClick = () => {
    return step === Step.View ? handleClose() : () => setStep(Step.View);
  };

  const title =
    step === Step.View
      ? i18n.t("verifyseedphrase.title.recovery")
      : i18n.t("verifyseedphrase.title.verify");

  const back =
    step === Step.View
      ? i18n.t("verifyseedphrase.button.cancel")
      : i18n.t("verifyseedphrase.button.back");

  return (
    <IonModal isOpen={show}>
      <ScrollablePageLayout
        header={
          <PageHeader
            title={title}
            closeButton
            closeButtonLabel={back}
            closeButtonAction={handleCloseButtonClick}
          />
        }
      >
        {getContent()}
      </ScrollablePageLayout>
    </IonModal>
  );
};

export { VerifySeedPhraseModal };
