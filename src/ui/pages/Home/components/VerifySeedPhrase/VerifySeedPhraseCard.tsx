import { IonButton, IonIcon } from "@ionic/react";
import { checkmark, syncOutline } from "ionicons/icons";
import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getAuthentication,
  setAuthentication,
} from "../../../../../store/reducers/stateCache";
import "./VerifySeedPhraseCard.scss";
import { VerifySeedPhraseModal } from "./VerifySeedPhraseModal";

const MESSAGE_TIMEOUT = 500;

const VerifySeedPhraseCard = () => {
  const authentication = useAppSelector(getAuthentication);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => {
      dispatch(
        setAuthentication({
          ...authentication,
          seedPhraseIsSet: true,
        })
      );
    }, MESSAGE_TIMEOUT);
  };

  if (authentication.seedPhraseIsSet) return null;

  if (showSuccess) {
    return (
      <div className="success-alert">
        <IonIcon icon={checkmark} />
        <p>{i18n.t("tabs.home.tab.verifyseedphrase.successmessage")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="verify-seedphrase-card">
        <div className="verify-seedphrase-header">
          <IonIcon icon={syncOutline} />
          <div className="verify-seedphrase-header-content">
            <h3>{i18n.t("tabs.home.tab.verifyseedphrase.header")}</h3>
            <p>{i18n.t("tabs.home.tab.verifyseedphrase.text")}</p>
          </div>
        </div>
        <IonButton
          shape="round"
          expand="block"
          className="primary-button"
          onClick={() => setOpen(true)}
        >
          {i18n.t("tabs.home.tab.verifyseedphrase.button")}
        </IonButton>
      </div>
      <VerifySeedPhraseModal
        onVerifySuccess={showSuccessMessage}
        show={open}
        setShow={setOpen}
      />
    </>
  );
};

export { VerifySeedPhraseCard };
