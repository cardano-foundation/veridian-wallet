import { i18n } from "../../../../../i18n";
import { ResponsivePageLayout } from "../../../layout/ResponsivePageLayout";
import { PageFooter } from "../../../PageFooter";
import { PageHeader } from "../../../PageHeader";
import CitizenPortal from "./citizen-portal.svg";
import "./IncomingRequest.scss";
import { IncomingRequestProps } from "./IncomingRequest.types";

const IncomingRequest = ({
  setShowConfirmation,
  setConfirmConnection,
  scannedValue,
}: IncomingRequestProps) => {
  const pageId = "connect-incoming-request";
  const url = new URL(scannedValue);
  const type = url.searchParams.get("type");
  const logo = type === "guardianship" ? CitizenPortal : CitizenPortal; //TODO: Placeholder for different logos based on type
  const requester = type === "guardianship" ? "Citizen Portal" : "Unknown";

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
            <img
              src={logo}
              alt="Citizen Portal"
            />
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
