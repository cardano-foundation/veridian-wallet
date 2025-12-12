import { IonModal } from "@ionic/react";
import { refreshOutline, keyOutline } from "ionicons/icons";
import { useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { i18n } from "../../../../../i18n";
import { useAppDispatch } from "../../../../../store/hooks";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { CardBlock, CardDetailsItem } from "../../../../components/CardDetails";
import { InfoCard } from "../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Spinner } from "../../../../components/Spinner";
import { Verification } from "../../../../components/Verification";
import { ToastMsgType } from "../../../../globals/types";
import "./RotateKeyModal.scss";
import { RotateKeyModalProps } from "./RotateKeyModal.types";
import { showError } from "../../../../utils/error";

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
      showError(
        "Failed to rotate identifier",
        e,
        dispatch,
        ToastMsgType.ROTATE_KEY_ERROR
      );
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
              closeButtonLabel={`${i18n.t(
                "tabs.home.tab.modals.rotatekeys.close"
              )}`}
              closeButtonAction={onClose}
              title={`${i18n.t("tabs.home.tab.modals.rotatekeys.title")}`}
            />
          }
          footer={
            <PageFooter
              customClass="rotate-key-footer"
              pageId="rotate-key"
              primaryButtonIcon={refreshOutline}
              primaryButtonText={`${i18n.t(
                "tabs.home.tab.modals.rotatekeys.confirm"
              )}`}
              primaryButtonAction={handleRotateKey}
              primaryButtonDisabled={loading}
            />
          }
        >
          <p className="description">
            {i18n.t("tabs.home.tab.modals.rotatekeys.description")}
          </p>
          <CardBlock
            copyContent={signingKey}
            title={i18n.t("tabs.home.tab.modals.rotatekeys.signingkey")}
          >
            <CardDetailsItem
              info={`${signingKey.substring(0, 5)}...${signingKey.slice(-5)}`}
              icon={keyOutline}
              testId={"signing-key"}
            />
            <Spinner show={loading} />
          </CardBlock>
          <InfoCard
            warning={true}
            content={i18n.t("tabs.home.tab.modals.rotatekeys.message")}
          />
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
