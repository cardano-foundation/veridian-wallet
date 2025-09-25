import { useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { getConnectionsCache } from "../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Spinner } from "../../../../components/Spinner";
import { SpinnerConverage } from "../../../../components/Spinner/Spinner.type";
import { Verification } from "../../../../components/Verification";
import { ToastMsgType } from "../../../../globals/types";
import { showError } from "../../../../utils/error";
import { NotificationDetailsProps } from "../../NotificationDetails.types";
import "./CredentialShareRequest.scss";
import CitizenPortal from "../../../../assets/images/citizen-portal.svg";
import { ResponsivePageLayout } from "../../../../components/layout/ResponsivePageLayout";

const CredentialShareRequest = ({
  activeStatus,
  handleBack,
  notificationDetails,
}: NotificationDetailsProps) => {
  const pageId = "credential-share-request";
  const dispatch = useAppDispatch();
  const connections = useAppSelector(getConnectionsCache);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const connectionName = connections.find(
    (c) => c.id === notificationDetails.connectionId
  );
  const requester = connectionName?.label || "Unknown";
  const logo = requester === "Citizen Portal" ? CitizenPortal : CitizenPortal; //TODO: Placeholder for different logos based on type
  const [loading, showLoading] = useState(false);

  const handleShare = async () => {
    try {
      showLoading(true);
      await Agent.agent.credentials.shareCredentials(
        notificationDetails.id,
        notificationDetails.a.d as string
      );
      dispatch(setToastMsg(ToastMsgType.CREDENTIAL_SHARE_SUCCESS));
      handleBack();
    } catch (e) {
      showError("Failed to share", e, dispatch);
    } finally {
      showLoading(false);
    }
  };

  return (
    <>
      <ResponsivePageLayout
        pageId={pageId}
        activeStatus={activeStatus}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleBack}
            closeButtonLabel={`${i18n.t(
              "tabs.notifications.details.credential.credentialshare.close"
            )}`}
            title={`${i18n.t(
              "tabs.notifications.details.credential.credentialshare.title"
            )}`}
          />
        }
      >
        <div className="credential-share-request-center">
          <div className="credential-share-request-icons-row">
            <div className="credential-share-request-user-logo">
              <img
                src={logo}
                alt="Citizen Portal"
              />
            </div>
          </div>
          <p className="credential-share-request-message">
            {`${i18n.t(
              "tabs.notifications.details.credential.credentialshare.message",
              {
                requester,
              }
            )}`}
          </p>
        </div>
        <PageFooter
          customClass="credential-share-request-footer"
          pageId={pageId}
          primaryButtonText={`${i18n.t(
            "tabs.notifications.details.credential.credentialshare.button.accept"
          )}`}
          primaryButtonAction={() => setVerifyIsOpen(true)}
          declineButtonText={`${i18n.t(
            "tabs.notifications.details.credential.credentialshare.button.decline"
          )}`}
          declineButtonAction={handleBack}
        />
      </ResponsivePageLayout>
      <Spinner
        show={loading}
        coverage={SpinnerConverage.Screen}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleShare}
      />
    </>
  );
};

export { CredentialShareRequest };
