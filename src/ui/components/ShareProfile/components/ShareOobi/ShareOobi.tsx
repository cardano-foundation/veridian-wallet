import { Share } from "@capacitor/share";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { shareOutline } from "ionicons/icons";
import { QRCode } from "react-qrcode-logo";
import { i18n } from "../../../../../i18n";
import "./ShareOobi.scss";
import { ShareOobiProps } from "./ShareOobi.types";

const SHARE_CANCELLED_ERROR = "Share canceled";
const ShareOobi = ({ oobi }: ShareOobiProps) => {
  const nativeShare = () => {
    Share.share({
      text: oobi,
    }).catch((e) => {
      if (e.message === SHARE_CANCELLED_ERROR) return;
      throw e;
    });
  };

  return (
    <div className="share-profile-oobi">
      <div className="share-profile-body">
        <div
          className={`share-profile-body-component share-qr ${
            oobi ? "reveal" : "blur"
          }`}
          data-testid="share-profile-qr-code"
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
              {!oobi && <IonSpinner name="circular" />}
              <div className="text">
                <p className="top">
                  {i18n.t("setupgroupprofile.setupmembers.pending.top")}
                </p>
                <p className="bottom">
                  {i18n.t("setupgroupprofile.setupmembers.pending.bottom")}
                </p>
              </div>
            </span>
          </span>
        </div>
        <IonButton
          shape="round"
          expand="block"
          className="secondary-button"
          onClick={nativeShare}
        >
          <IonIcon
            slot="start"
            icon={shareOutline}
          />
          {i18n.t("shareprofile.shareoobi.button")}
        </IonButton>
      </div>
    </div>
  );
};

export { ShareOobi };
