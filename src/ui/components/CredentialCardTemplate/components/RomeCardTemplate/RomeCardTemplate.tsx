import { IonChip, IonIcon } from "@ionic/react";
import { hourglassOutline } from "ionicons/icons";
import { useState } from "react";
import { CredentialStatus } from "../../../../../core/agent/services/credentialService.types";
import { i18n } from "../../../../../i18n";
import RomeBackground from "../../../../assets/images/rome-bg.png";
import { formatShortDate } from "../../../../utils/formatters";
import { Alert } from "../../../Alert";
import { CredentialCardTemplateProps } from "../../CredentialCardTemplate.types";
import { useCardOffsetTop } from "../../hook/cardOffsetTopHook";
import "./RomeCardTemplate.scss";

const RomeCardTemplate = ({
  name = "default",
  cardData,
  isActive,
  index = 0,
  onHandleShowCardDetails,
  pickedCard,
}: CredentialCardTemplateProps) => {
  const { getCardOffsetTop, cardRef } = useCardOffsetTop();
  const [alertIsOpen, setAlertIsOpen] = useState(false);

  const CredentialCardTemplateStyles = {
    zIndex: index,
    backgroundImage: `url(${RomeBackground})`,
    backgroundSize: "cover",
    transform: pickedCard
      ? `translateY(${-getCardOffsetTop() * index}px)`
      : undefined,
  };

  const handleCardClick = () => {
    if (cardData.status === CredentialStatus.PENDING) {
      setAlertIsOpen(true);
    } else if (onHandleShowCardDetails) {
      onHandleShowCardDetails(index);
    }
  };

  return (
    <div
      ref={cardRef}
      key={index}
      data-testid={`rome-card-template${
        index !== undefined ? `-${name}-index-${index}` : ""
      }`}
      className={`rome-card-template ${isActive ? "active" : ""} ${
        pickedCard ? "picked-card" : "not-picked"
      }`}
      onClick={() => handleCardClick()}
      style={CredentialCardTemplateStyles}
    >
      <div className={`rome-card-template-inner ${cardData.status}`}>
        <div className="card-header">
          {cardData.status === CredentialStatus.PENDING ? (
            <IonChip>
              <IonIcon
                icon={hourglassOutline}
                color="primary"
              />
              <span>{CredentialStatus.PENDING}</span>
            </IonChip>
          ) : null}
        </div>
        <div className="card-footer">
          <div className="card-footer-column">
            <span className="card-footer-column-label card-text">
              {i18n.t("tabs.credentials.layout.issued")}
            </span>
            <span className="card-footer-column-value card-text">
              {cardData.status === CredentialStatus.CONFIRMED ? (
                formatShortDate(cardData.issuanceDate)
              ) : (
                <>&nbsp;</>
              )}
            </span>
          </div>
        </div>
      </div>
      {cardData.status === CredentialStatus.PENDING && alertIsOpen && (
        <Alert
          isOpen={alertIsOpen}
          setIsOpen={setAlertIsOpen}
          dataTestId="alert-confirm"
          headerText={i18n.t("tabs.credentials.create.alert.title")}
          confirmButtonText={`${i18n.t(
            "tabs.credentials.create.alert.confirm"
          )}`}
          actionConfirm={() => setAlertIsOpen(false)}
          backdropDismiss={false}
        />
      )}
    </div>
  );
};

export { RomeCardTemplate };
