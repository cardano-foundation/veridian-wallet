import { i18n } from "../../../../../i18n";
import { ResponsivePageLayout } from "../../../layout/ResponsivePageLayout";
import { PageFooter } from "../../../PageFooter";
import { PageHeader } from "../../../PageHeader";
import CitizenPortal from "./citizen-portal.svg";
import "./IncomingRequest.scss";

const IncomingRequest = ({
  setShowConfirmation,
  setConfirmConnection,
}: {
  setShowConfirmation: (show: boolean) => void;
  setConfirmConnection: (confirm: boolean) => void;
}) => {
  const pageId = "connect-incoming-request";

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
      header={<PageHeader title="Login request" />}
    >
      <div className="connect-incoming-request-center">
        <div className="connect-incoming-request-icons-row">
          <div className="connect-incoming-request-user-logo">
            <img
              src={CitizenPortal}
              alt="Citizen Portal"
            />
          </div>
        </div>
        <p className="connect-incoming-request-message">
          Citizen Portal is requesting approval for a login attempt
        </p>
      </div>
      <PageFooter
        customClass="connect-incoming-request-footer"
        pageId={pageId}
        primaryButtonText={`Login`}
        primaryButtonAction={handleAccept}
        declineButtonText={`Don't allow`}
        declineButtonAction={handleDecline}
      />
    </ResponsivePageLayout>
  );
};
export { IncomingRequest };
