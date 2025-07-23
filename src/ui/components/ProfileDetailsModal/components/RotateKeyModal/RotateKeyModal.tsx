import { IonModal } from "@ionic/react";
import { refreshOutline } from "ionicons/icons";
import { useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { i18n } from "../../../../../i18n";
import { useAppDispatch } from "../../../../../store/hooks";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { CardDetailsBlock, CardDetailsItem } from "../../../CardDetails";
import { InfoCard } from "../../../InfoCard";
import { ScrollablePageLayout } from "../../../layout/ScrollablePageLayout";
import { PageFooter } from "../../../PageFooter";
import { PageHeader } from "../../../PageHeader";
import { Spinner } from "../../../Spinner";
import { Verification } from "../../../Verification";
import { ToastMsgType } from "../../../../globals/types";
import "./RotateKeyModal.scss";
import { RotateKeyModalProps } from "./RotateKeyModal.types";

const RotateKeyModal = ({
  isOpen,
  signingKey,
  identifierId,
  onClose,
  onReloadData,
}: RotateKeyModalProps) => {
  const dispatch = useAppDispatch();
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRotateKey = () => {
    setVerifyIsOpen(true);
  };

  const handleAfterVerify = async () => {
    setLoading(true);

    try {
      await Agent.agent.identifiers.rotateIdentifier(identifierId);
      await onReloadData();
      dispatch(setToastMsg(ToastMsgType.ROTATE_KEY_SUCCESS));
    } catch (e) {
      dispatch(setToastMsg(ToastMsgType.ROTATE_KEY_ERROR));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IonModal
        className="rotate-keys-modal"
        onDidDismiss={onClose}
        isOpen={isOpen}
        data-testid="rotate-keys"
      >
        <ScrollablePageLayout
          header={
            <PageHeader
              closeButton
              closeButtonLabel={`${i18n.t("profiledetails.rotatekeys.done")}`}
              closeButtonAction={onClose}
              title={`${i18n.t("profiledetails.options.rotatekeys")}`}
            />
          }
          footer={
            <PageFooter
              customClass="rotate-key-footer"
              pageId="rotate-key"
              primaryButtonIcon={refreshOutline}
              primaryButtonText={`${i18n.t(
                "profiledetails.options.rotatekeys"
              )}`}
              primaryButtonAction={handleRotateKey}
              primaryButtonDisabled={loading}
            />
          }
        >
          <p className="description">
            {i18n.t("profiledetails.rotatekeys.description")}
          </p>
          <InfoCard content={i18n.t("profiledetails.rotatekeys.message")} />
          <CardDetailsBlock
            title={i18n.t("profiledetails.rotatekeys.signingkey")}
          >
            <CardDetailsItem
              info={signingKey}
              copyButton={true}
              testId={"signing-key"}
            />
            <Spinner show={loading} />
          </CardDetailsBlock>
        </ScrollablePageLayout>
      </IonModal>
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleAfterVerify}
      />
    </>
  );
};

export { RotateKeyModal };
