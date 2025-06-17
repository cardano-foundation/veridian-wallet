import { IonButton, IonIcon, IonItem, IonLabel, IonList } from "@ionic/react";
import { copyOutline, trashOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { QRCode } from "react-qrcode-logo";
import { CreationStatus } from "../../../../core/agent/agent.types";
import { i18n } from "../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { getIdentifiersCache } from "../../../../store/reducers/identifiersCache";
import { setToastMsg } from "../../../../store/reducers/stateCache";
import { ToastMsgType } from "../../../globals/types";
import { writeToClipboard } from "../../../utils/clipboard";
import { FallbackIcon } from "../../FallbackIcon";
import { PageFooter } from "../../PageFooter";
import { PageHeader } from "../../PageHeader";
import { Spinner } from "../../Spinner";
import { SpinnerConverage } from "../../Spinner/Spinner.type";
import { ScrollablePageLayout } from "../../layout/ScrollablePageLayout";
import { IdentifierStage1BodyProps } from "../CreateGroupIdentifier.types";

const SetupConnectionBodyResume = ({
  componentId,
  handleDone,
  handleInitiateMultiSig,
  oobi,
  identifierId,
  groupMetadata,
  handleScanButton,
  scannedConections,
  handleDelete,
}: IdentifierStage1BodyProps) => {
  const dispatch = useAppDispatch();
  const identifiers = useAppSelector(getIdentifiersCache);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    identifiers &&
      identifiers[identifierId]?.creationStatus === CreationStatus.COMPLETE &&
      setIsPending(false);
  }, [identifierId, identifiers]);

  const copyToClipboard = () => {
    writeToClipboard(oobi);
    dispatch(setToastMsg(ToastMsgType.COPIED_TO_CLIPBOARD));
  };

  return (
    <>
      <ScrollablePageLayout
        pageId={componentId + "-content"}
        customClass={`${
          groupMetadata?.groupInitiator ? "initiator-view" : "receiver-view"
        }`}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleDone}
            closeButtonLabel={`${i18n.t("createidentifier.done")}`}
            title={`${i18n.t("createidentifier.share.title")}`}
          />
        }
        footer={
          groupMetadata?.groupInitiator && (
            <PageFooter
              pageId="initiate-multi-sig"
              primaryButtonText={`${i18n.t(
                "createidentifier.share.initiatebutton"
              )}`}
              primaryButtonAction={handleInitiateMultiSig}
              primaryButtonDisabled={!scannedConections?.length}
            />
          )
        }
      >
        <p className="multisig-share-note">
          {i18n.t(
            groupMetadata?.groupInitiator
              ? "createidentifier.share.notes.top"
              : "createidentifier.receive.notes.top"
          )}
        </p>
        <div
          className={`multisig-share-qr-code${
            oobi.length && !isPending ? " reveal" : " blur"
          }`}
          data-testid="multisig-share-qr-code"
        >
          <div className="qr-container">
            <QRCode
              value={oobi}
              size={250}
              fgColor={"black"}
              bgColor={"white"}
              qrStyle={"squares"}
              logoImage={""}
              logoWidth={60}
              logoHeight={60}
              logoOpacity={1}
              quietZone={10}
            />
            <span className="multisig-share-qr-code-blur-overlay-container">
              <span className="multisig-share-qr-code-blur-overlay-inner">
                <Spinner
                  show={isPending}
                  coverage={SpinnerConverage.Container}
                />
                <div className="text">
                  <p className="top">
                    {i18n.t("createidentifier.share.pending.top")}
                  </p>
                  <p className="bottom">
                    {i18n.t("createidentifier.share.pending.bottom")}
                  </p>
                </div>
              </span>
            </span>
          </div>
          <IonButton
            shape="round"
            expand="block"
            fill="outline"
            className="copy-button secondary-button"
            data-testid={`copy-button-${componentId}`}
            onClick={copyToClipboard}
            disabled={isPending}
          >
            {i18n.t("createidentifier.share.copybutton")}
            <IonIcon
              slot="end"
              size="small"
              icon={copyOutline}
              color="primary"
            />
          </IonButton>
        </div>
        <p className="multisig-share-note">
          {i18n.t(
            groupMetadata?.groupInitiator
              ? "createidentifier.share.notes.middle"
              : "createidentifier.receive.notes.middle"
          )}
        </p>
        <div className="share-identifier-scan-button">
          <IonButton
            shape="round"
            expand="block"
            fill="outline"
            data-testid="share-resume-identifier-scan-button"
            className="secondary-button"
            onClick={handleScanButton}
            disabled={isPending}
          >
            {i18n.t("createidentifier.share.scanbutton")}
          </IonButton>
        </div>
        <h3>{i18n.t("createidentifier.share.subtitle")}</h3>
        {!scannedConections?.length ? (
          <p
            className="multisig-share-note multisig-share-note-footer"
            data-testid="multisig-share-note-bottom"
          >
            {i18n.t("createidentifier.share.notes.bottom")}
          </p>
        ) : (
          <IonList>
            {scannedConections.map((connection, index) => {
              return (
                <IonItem key={index}>
                  <IonLabel className="connection-item">
                    <FallbackIcon
                      src={connection?.logo}
                      className="connection-logo"
                      data-testid="identifier-stage-1-logo"
                      alt="connection-logo"
                    />
                    <span className="connection-name">{connection.label}</span>
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonList>
        )}
        <IonButton
          shape="round"
          expand="block"
          fill="clear"
          className="delete-button"
          data-testid="delete-button-initiate-multi-sig"
          onClick={handleDelete}
        >
          <IonIcon
            slot="icon-only"
            size="small"
            icon={trashOutline}
            color="primary"
          />
          {i18n.t("createidentifier.share.delete")}
        </IonButton>
      </ScrollablePageLayout>
    </>
  );
};

export { SetupConnectionBodyResume };
