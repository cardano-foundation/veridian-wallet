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
import "./CredentialIssuanceRequest.scss";
import { informationCircleOutline } from "ionicons/icons";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { InfoCard } from "../../../../components/InfoCard";
import { CardDetailsBlock } from "../../../../components/CardDetails";
import { IonItem, IonText } from "@ionic/react";
import { MemberAvatar } from "../../../../components/Avatar";

const CredentialIssuanceRequest = ({
  activeStatus,
  handleBack,
  notificationDetails,
}: NotificationDetailsProps) => {
  const pageId = "credential-issuance-request";
  const dispatch = useAppDispatch();
  const connections = useAppSelector(getConnectionsCache);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const connectionName = connections.find(
    (c) => c.id === notificationDetails.connectionId
  );
  const credential = {
    type: "Social Media Access",
    requester: "Citizen Portal",
    issueTo: "Oliver Anderson",
  };
  const profile = {
    identity: {
      id: "123",
      firstName: "Oliver",
      lastName: "Anderson",
      email: "oliver.anderson123@gmail.com",
      dob: "12/07/2012",
      agerange: ["13", "16"],
      curfew: ["08:00", "22:00"],
    },
  };
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
      <ScrollablePageLayout
        pageId={pageId}
        activeStatus={activeStatus}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleBack}
            closeButtonLabel={`${i18n.t(
              "tabs.notifications.details.credential.credentialissuance.close"
            )}`}
            title={`${i18n.t(
              "tabs.notifications.details.credential.credentialissuance.title"
            )}`}
          />
        }
        footer={
          <PageFooter
            pageId={pageId}
            primaryButtonText={`${i18n.t(
              "tabs.notifications.details.credential.credentialissuance.button.accept"
            )}`}
            primaryButtonAction={() => setVerifyIsOpen(true)}
            declineButtonText={`${i18n.t(
              "tabs.notifications.details.credential.credentialissuance.button.decline"
            )}`}
            declineButtonAction={handleBack}
          />
        }
      >
        <p className="credential-issuance-request-subtitle">
          {i18n.t(
            "tabs.notifications.details.credential.credentialissuance.subtitle"
          )}
        </p>
        <InfoCard
          className="alert"
          icon={informationCircleOutline}
          content={i18n.t(
            "tabs.notifications.details.credential.credentialissuance.message",
            {
              requester: credential.requester,
            }
          )}
        />
        <CardDetailsBlock>
          <IonItem lines="none">
            <IonText>
              {i18n.t(
                "tabs.notifications.details.credential.credentialissuance.issueto"
              )}
            </IonText>
          </IonItem>
          <IonItem lines="none">
            <MemberAvatar
              firstLetter={`${credential.issueTo.charAt(0)}`}
              rank={0}
            />
            <IonText>{profile.identity.firstName}</IonText>
          </IonItem>
        </CardDetailsBlock>
        <CardDetailsBlock>
          <IonItem lines="none">
            <IonText>
              {i18n.t(
                "tabs.notifications.details.credential.credentialissuance.issuingcredential"
              )}
            </IonText>
          </IonItem>
          <IonItem lines="none">
            <IonText>{credential.type}</IonText>
          </IonItem>
        </CardDetailsBlock>
        <CardDetailsBlock>
          <IonItem lines="none">
            <IonText>
              {i18n.t(
                "tabs.notifications.details.credential.credentialissuance.credentialdetails.title"
              )}
            </IonText>
          </IonItem>
          <IonItem lines="none">
            <IonText>
              <span>
                {i18n.t(
                  "tabs.notifications.details.credential.credentialissuance.credentialdetails.name"
                )}
              </span>
              &nbsp;
              <span>
                {profile.identity.firstName} {profile.identity.lastName}
              </span>
            </IonText>
          </IonItem>
          <IonItem lines="none">
            <IonText>
              <span>
                {i18n.t(
                  "tabs.notifications.details.credential.credentialissuance.credentialdetails.email"
                )}
                &nbsp;
              </span>{" "}
              <span>{profile.identity.email}</span>
            </IonText>
          </IonItem>
          <IonItem lines="none">
            <IonText>
              <span>
                {i18n.t(
                  "tabs.notifications.details.credential.credentialissuance.credentialdetails.dob"
                )}
              </span>{" "}
              <span>{profile.identity.dob}</span>
            </IonText>
          </IonItem>
          <IonItem lines="none">
            <IonText>
              <span>
                {i18n.t(
                  "tabs.notifications.details.credential.credentialissuance.credentialdetails.agerange"
                )}
              </span>{" "}
              <span>{`${profile.identity.agerange[0]}-${profile.identity.agerange[1]}`}</span>
            </IonText>
          </IonItem>
          <IonItem lines="none">
            <IonText>
              <span>
                {i18n.t(
                  "tabs.notifications.details.credential.credentialissuance.credentialdetails.curfew"
                )}
              </span>{" "}
              <span>{`${profile.identity.curfew[0]}-${profile.identity.curfew[1]}`}</span>
            </IonText>
          </IonItem>
        </CardDetailsBlock>
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

export { CredentialIssuanceRequest };
