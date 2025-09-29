import { i18n } from "../../../../../i18n";
import { ResponsivePageLayout } from "../../../layout/ResponsivePageLayout";
import { PageFooter } from "../../../PageFooter";
import { PageHeader } from "../../../PageHeader";
import CitizenPortal from "../../../../assets/images/citizen-portal.svg";
import Socialbook from "../../../../assets/images/socialbook.svg";
import "./IncomingRequest.scss";
import { IncomingRequestProps } from "./IncomingRequest.types";
import { useEffect, useState } from "react";
import { QR_CODE_TYPES } from "../../ProfileDetailsModal.types";
import { IonIcon } from "@ionic/react";
import { personCircleOutline } from "ionicons/icons";

const IncomingRequest = ({
  setShowConfirmation,
  setConfirmConnection,
  scannedValue,
}: IncomingRequestProps) => {
  const pageId = "connect-incoming-request";
  const { backendOobi } = JSON.parse(scannedValue);

  if (!backendOobi) {
    throw new Error("Invalid QR code data: missing backendOobi field");
  }

  const url = new URL(backendOobi);
  const type = url.searchParams.get("type");
  const [requester, setRequester] = useState<string>("Unknown");
  const [logo, setLogo] = useState<string>("Unknown");

  useEffect(() => {
    if (Object.values(QR_CODE_TYPES).includes(type as any)) {
      if (type === QR_CODE_TYPES.GUARDIANSHIP) {
        setRequester("Citizen Portal");
        setLogo(CitizenPortal);
      } else if (type === QR_CODE_TYPES.SOCIALMEDIA) {
        setRequester("Socialbook");
        setLogo(Socialbook);
      }
    }
  }, [type]);

  const handleAccept = () => {
    setConfirmConnection(true);
    setShowConfirmation(false);
  };

  const handleDecline = () => {
    setConfirmConnection(false);
    setShowConfirmation(false);
  };

  return (
    <ResponsivePageLayout
      pageId={pageId}
      activeStatus={true}
      header={
        <PageHeader
          title={`${i18n.t("profiledetails.incomingrequest.title")}`}
        />
      }
    >
      <div className="connect-incoming-request-center">
        <div className="connect-incoming-request-icons-row">
          <div className="connect-incoming-request-user-logo">
            {logo === "Unknown" ? (
              <div className="fallback-logo">
                <IonIcon
                  icon={personCircleOutline}
                  color="light"
                />
              </div>
            ) : (
              <img
                src={logo}
                className={
                  logo === CitizenPortal
                    ? "citizen-portal-logo"
                    : "socialbook-logo"
                }
                alt="Requester Logo"
              />
            )}
          </div>
        </div>
        <p className="connect-incoming-request-message">
          {`${i18n.t("profiledetails.incomingrequest.message", { requester })}`}
        </p>
      </div>
      <PageFooter
        customClass="connect-incoming-request-footer"
        pageId={pageId}
        primaryButtonText={`${i18n.t(
          "profiledetails.incomingrequest.button.accept"
        )}`}
        primaryButtonAction={handleAccept}
        declineButtonText={`${i18n.t(
          "profiledetails.incomingrequest.button.decline"
        )}`}
        declineButtonAction={handleDecline}
      />
    </ResponsivePageLayout>
  );
};
export { IncomingRequest };
