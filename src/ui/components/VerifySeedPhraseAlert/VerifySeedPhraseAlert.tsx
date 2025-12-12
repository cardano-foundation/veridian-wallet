import { IonButton, IonModal } from "@ionic/react";
import { useState } from "react";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getShowVerifySeedPhraseAlert,
  setSeedPhraseVerified,
  showVerifySeedPhraseAlert,
} from "../../../store/reducers/stateCache";
import FilledIcon from "../../assets/images/filled.png";
import MissingMobileImage from "../../assets/images/mobile_question.png";
import PasswordImage from "../../assets/images/password_icon.png";
import { VerifySeedPhraseModal } from "../../pages/Home/components/VerifySeedPhrase";
import "./VerifySeedPhraseAlert.scss";

export const VerifySeedPhraseAlert = () => {
  const pageId = "verify-seedphrase-alert";
  const showAlert = useAppSelector(getShowVerifySeedPhraseAlert);
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const verifySuccess = () => {
    setIsOpen(false);
    dispatch(showVerifySeedPhraseAlert(false));
    dispatch(setSeedPhraseVerified(true));
  };

  return (
    <>
      <IonModal
        className={pageId}
        isOpen={!!showAlert}
      >
        <div className="content">
          <img
            className="title-image"
            src={FilledIcon}
          />
          <h2 className="title">{i18n.t("verifyseedphrasealert.title")}</h2>
          <p className="text">{i18n.t("verifyseedphrasealert.text")}</p>
          <div className="benefits">
            <div className="benefit-info">
              <img
                src={PasswordImage}
                alt="missing password"
              />
              <p>{i18n.t("verifyseedphrasealert.firstinfo")}</p>
            </div>
            <div className="benefit-info">
              <img
                src={MissingMobileImage}
                alt="missing device"
              />
              <p>{i18n.t("verifyseedphrasealert.secondinfo")}</p>
            </div>
          </div>
          <IonButton
            shape="round"
            expand="block"
            className="primary-button"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            {i18n.t("verifyseedphrasealert.button")}
          </IonButton>
        </div>
      </IonModal>
      <VerifySeedPhraseModal
        show={isOpen}
        setShow={setIsOpen}
        onVerifySuccess={verifySuccess}
      />
    </>
  );
};
