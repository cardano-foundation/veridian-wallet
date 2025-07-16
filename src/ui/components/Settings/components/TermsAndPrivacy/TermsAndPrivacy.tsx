import { IonCard, IonIcon, IonItem, IonLabel, IonList } from "@ionic/react";
import { chevronForward } from "ionicons/icons";
import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { TermsModal } from "../../../TermsModal";
const TermsAndPrivacy = () => {
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);

  return (
    <>
      <div className="settings-section-title-placeholder" />
      <IonCard>
        <IonList
          lines="none"
          data-testid="settings-security-items"
        >
          <IonItem
            onClick={() => setOpenTerms(true)}
            className="settings-item"
            data-testid="terms-modal-btn"
          >
            <IonLabel>
              {i18n.t("settings.sections.support.terms.submenu.termsofuse")}
            </IonLabel>
            <IonIcon
              aria-hidden="true"
              icon={chevronForward}
              slot="end"
            />
          </IonItem>
          <IonItem
            onClick={() => setOpenPrivacy(true)}
            className="settings-item"
            data-testid="privacy-modal-btn"
          >
            <IonLabel>
              {i18n.t("settings.sections.support.terms.submenu.privacy")}
            </IonLabel>
            <IonIcon
              aria-hidden="true"
              icon={chevronForward}
              slot="end"
            />
          </IonItem>
        </IonList>
      </IonCard>
      <TermsModal
        name="terms-of-use"
        isOpen={openTerms}
        setIsOpen={setOpenTerms}
        altIsOpen={setOpenPrivacy}
      />
      <TermsModal
        name="privacy-policy"
        isOpen={openPrivacy}
        setIsOpen={setOpenPrivacy}
        altIsOpen={setOpenTerms}
      />
    </>
  );
};

export { TermsAndPrivacy };
