import { Share } from "@capacitor/share";
import { IonButton, IonIcon } from "@ionic/react";
import { copyOutline, openOutline, qrCodeOutline } from "ionicons/icons";
import { QRCode } from "react-qrcode-logo";
import { i18n } from "../../../i18n";
import { useAppDispatch } from "../../../store/hooks";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { ToastMsgType } from "../../globals/types";
import { writeToClipboard } from "../../utils/clipboard";
import { PageHeader } from "../PageHeader";
import { ResponsiveModal } from "../layout/ResponsiveModal";
import "./ShareConnection.scss";
import { ShareConnectionProps, ShareType } from "./ShareConnection.types";

const SHARE_CANCELLED_ERROR = "Share canceled";
const ShareConnection = ({
  isOpen,
  setIsOpen,
  oobi,
  shareType: shareLocation = ShareType.Identifier,
}: ShareConnectionProps) => {
  const componentId = "share-connection-modal";
  const dispatch = useAppDispatch();

  const subtitle = (() => {
    switch (shareLocation) {
      case ShareType.Connection:
        return i18n.t("shareidentifier.subtitle.connection");
      default:
        return i18n.t("shareidentifier.subtitle.identifier");
    }
  })();

  const nativeShare = () => {
    Share.share({
      text: oobi,
    }).catch((e) => {
      if (e.message === SHARE_CANCELLED_ERROR) return;
      throw e;
    });
  };

  const closeModal = () => setIsOpen(false);

  return (
    <ResponsiveModal
      modalIsOpen={isOpen}
      componentId={componentId}
      customClasses={componentId}
      onDismiss={closeModal}
    >
      <PageHeader
        closeButton={true}
        closeButtonLabel={`${i18n.t("shareidentifier.done")}`}
        closeButtonAction={closeModal}
        title={`${i18n.t("shareidentifier.title")}`}
      />
      <p className="share-identifier-subtitle">{subtitle}</p>
      <div className="share-identifier-body">
        <div
          className={`share-identifier-body-component share-qr ${
            oobi ? "reveal" : "blur"
          }`}
          data-testid="share-identifier-qr-code"
        >
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
          <span className="share-qr-code-blur-overlay-container">
            <span className="share-qr-code-blur-overlay-inner">
              <IonIcon
                slot="icon-only"
                icon={qrCodeOutline}
              />
            </span>
          </span>
        </div>
        <div className="share-identifier-divider">
          <span className="share-identifier-divider-line" />
          <span className="share-identifier-divider-text">
            {i18n.t("shareidentifier.divider")}
          </span>
          <span className="share-identifier-divider-line" />
        </div>
        <div className="share-identifier-body-component">
          <span
            className="share-identifier-option"
            onClick={() => {
              writeToClipboard(oobi);
              dispatch(setToastMsg(ToastMsgType.COPIED_TO_CLIPBOARD));
            }}
          >
            <span>
              <IonButton
                data-testid="share-identifier-copy-button"
                shape="round"
              >
                <IonIcon
                  slot="icon-only"
                  icon={copyOutline}
                />
              </IonButton>
            </span>
            <span
              className="share-identifier-label"
              data-testid="share-identifier-copy-label"
            >
              {i18n.t("shareidentifier.copykey")}
            </span>
          </span>
          <span
            className="share-identifier-option"
            data-testid="share-identifier-share-button"
            onClick={nativeShare}
          >
            <span>
              <IonButton
                shape="round"
                data-testid="share-identifier-more-button"
              >
                <IonIcon
                  slot="icon-only"
                  icon={openOutline}
                />
              </IonButton>
            </span>
            <span
              className="share-identifier-info-block-data"
              data-testid="share-identifier-more-label"
            >
              {i18n.t("shareidentifier.more")}
            </span>
          </span>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export { ShareConnection };
