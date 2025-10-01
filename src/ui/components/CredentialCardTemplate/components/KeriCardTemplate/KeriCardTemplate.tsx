import { IonChip, IonIcon } from "@ionic/react";
import { hourglassOutline } from "ionicons/icons";
import { useState } from "react";
import { CredentialStatus } from "../../../../../core/agent/services/credentialService.types";
import { i18n } from "../../../../../i18n";
import { formatShortDate } from "../../../../utils/formatters";
import { Alert } from "../../../Alert";
import { useCardOffsetTop } from "../../../IdentifierCardTemplate";
import { CredentialCardTemplateProps } from "../../CredentialCardTemplate.types";
import "./KeriCardTemplate.scss";
import { CardTheme } from "../../../CardTheme";
import { useAppSelector } from "../../../../../store/hooks";
import { getConnectionsCache } from "../../../../../store/reducers/profileCache";
import { IpexCommunicationService } from "../../../../../core/agent/services";
import ACDCLogo from "../../../../../ui/assets/images/keri-acdc.svg";
import SediLogo from "../../../../../ui/assets/images/sedi-logo-dark.svg";
import GuardianshpLogo from "../../../../../ui/assets/images/guardianship-logo-light.svg";
import CitizenPortalLogo from "../../../../../ui/assets/images/citizen-portal-dark.svg";
import BackgroundGuardianship from "../../../../assets/images/guardianship-bg.png";
import BackgroundBirthCertificate from "../../../../assets/images/birth-certificate-bg.png";
import BackgroundSocialMedia from "../../../../assets/images/social-media-bg.png";

const KeriCardTemplate = ({
  name = "default",
  cardData,
  isActive,
  index = 0,
  onHandleShowCardDetails,
  pickedCard,
}: CredentialCardTemplateProps) => {
  const connections = useAppSelector(getConnectionsCache) as any[];
  const { getCardOffsetTop, cardRef } = useCardOffsetTop();
  const [alertIsOpen, setAlertIsOpen] = useState(false);

  const CredentialCardTemplateStyles = {
    zIndex: index,
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

  const connection = connections.find((c) => c.id === cardData.connectionId);

  const getSchemaMatch = () => {
    switch (cardData.schema) {
      case IpexCommunicationService.SCHEMA_SAID_GUARDIANSHIP:
        return {
          className: "guardianship",
          logo: GuardianshpLogo,
          background: <img src={BackgroundGuardianship} />,
        };
      case IpexCommunicationService.SCHEMA_SAID_BIRTH_CERTIFICATE:
        return {
          className: "birth-certificate",
          logo: SediLogo,
          background: <img src={BackgroundBirthCertificate} />,
        };
      case IpexCommunicationService.SCHEMA_SAID_SOCIAL_MEDIA:
        return {
          className: "social-media",
          logo: CitizenPortalLogo,
          background: <img src={BackgroundSocialMedia} />,
        };
      default:
        return {
          className: "default",
          logo: ACDCLogo,
          background: <CardTheme />,
        };
    }
  };

  return (
    <div
      ref={cardRef}
      key={index}
      data-testid={`keri-card-template${
        index !== undefined ? `-${name}-index-${index}` : ""
      }`}
      className={`keri-card-template ${isActive ? "active" : ""} ${
        pickedCard ? "picked-card" : "not-picked"
      }`}
      onClick={() => handleCardClick()}
      style={CredentialCardTemplateStyles}
    >
      <div className="cred-keri-bg">{getSchemaMatch().background}</div>
      <div
        className={`keri-card-template-inner ${cardData.status} ${
          getSchemaMatch().className
        }`}
      >
        <div className="card-header">
          <span className="card-logo">
            <img
              src={getSchemaMatch().logo}
              className={getSchemaMatch().className}
              alt="card-logo"
            />
          </span>
          {cardData.status === CredentialStatus.PENDING ? (
            <IonChip>
              <IonIcon
                icon={hourglassOutline}
                color="primary"
              />
              <span>{CredentialStatus.PENDING}</span>
            </IonChip>
          ) : (
            <span className="credential-type card-text">
              {cardData.credentialType}
            </span>
          )}
        </div>
        <div className="card-footer">
          <div className="card-footer-column">
            <span className="card-footer-column-label card-text">
              {i18n.t("tabs.credentials.layout.issuer")}
            </span>
            <span className="card-footer-column-value card-text">
              {connection?.label}
            </span>
          </div>
          <div className="card-footer-column">
            <span className="card-footer-column-label card-text">
              {i18n.t("tabs.credentials.layout.issued")}
            </span>
            <span className="card-footer-column-value card-text issued">
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

export { KeriCardTemplate };
