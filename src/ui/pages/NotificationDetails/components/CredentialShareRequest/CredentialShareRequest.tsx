import { IonIcon } from "@ionic/react";
import { useState } from "react";
import { personCircleOutline } from "ionicons/icons";
import { Agent } from "../../../../../core/agent/agent";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { getConnectionsCache } from "../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Spinner } from "../../../../components/Spinner";
import { SpinnerConverage } from "../../../../components/Spinner/Spinner.type";
import { Verification } from "../../../../components/Verification";
import { ToastMsgType } from "../../../../globals/types";
import { showError } from "../../../../utils/error";
import { NotificationDetailsProps } from "../../NotificationDetails.types";
import "./CredentialShareRequest.scss";

const CredentialShareRequest = ({
  pageId,
  activeStatus,
  handleBack,
  notificationDetails,
}: NotificationDetailsProps) => {
  const dispatch = useAppDispatch();
  const connections = useAppSelector(getConnectionsCache);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const connectionName = connections.find(
    (c) => c.id === notificationDetails.connectionId
  );
  const [loading, showLoading] = useState(true);

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
      <ScrollablePageLayout
        activeStatus={activeStatus}
        pageId={pageId}
        customClass="custom-sign-request"
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleBack}
            closeButtonLabel="Close"
            title={"Share Credentials"}
          />
        }
        footer={
          <PageFooter
            customClass="sign-footer"
            primaryButtonText="Confirm"
            primaryButtonAction={() => setVerifyIsOpen(true)}
            secondaryButtonText={`${i18n.t("request.button.dontallow")}`}
            secondaryButtonAction={handleBack}
          />
        }
      >
        <div className="sign-header">
          <div className="sign-owner-logo">
            <IonIcon
              data-testid="sign-logo"
              icon={personCircleOutline}
              color="light"
            />
          </div>
          <h2 className="sign-name">{connectionName?.label}</h2>
        </div>
        <h3 className="sign-info">Share your credentials</h3>
      </ScrollablePageLayout>
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
