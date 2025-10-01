import { useEffect, useState } from "react";
import { IonItem, IonText } from "@ionic/react";
import { informationCircleOutline } from "ionicons/icons";
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
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { InfoCard } from "../../../../components/InfoCard";
import { CardDetailsBlock } from "../../../../components/CardDetails";
import "./CredentialIssuanceRequest.scss";

import { MemberAvatar } from "../../../../components/Avatar";
import { RegularConnectionDetails } from "../../../../../core/agent/agent.types";

interface Restriction {
  minAge: number;
  maxAge: number;
  screenTimeStart: string; 
  screenTimeEnd: string; 
}


const CredentialIssuanceRequest = ({
  activeStatus,
  handleBack,
  notificationDetails,
}: NotificationDetailsProps) => {
  const pageId = "credential-issuance-request";
  const dispatch = useAppDispatch();
  const connectionsCache = useAppSelector(getConnectionsCache) as any[];
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [loading, showLoading] = useState(false);
  const [issuedToAid, setIssuedToAid] = useState("");
  const [propDetails, setPropDetails] = useState<Restriction | undefined>(undefined);

  const connectionName = connectionsCache?.find(
    (c: RegularConnectionDetails) => c.contactId === issuedToAid
  )?.label;

  const credential = {
    type: "Social Media Access",
    requester: "Citizen Portal",
    // TODO: GET it dynamic from propDetails(missing prop)
    issueTo: "Child",
  };
  
  const formatScreenTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const getRequestDetails = async () => {
      const data  = await Agent.agent.credentials.getSocialMediaCredentialPropData(
        notificationDetails.a.d as string
      );
      setIssuedToAid(data?.exn.a.a.i);
      setPropDetails(data?.exn.a.r);
    }
    getRequestDetails();
  }, []);

  const handleShare = async () => {
    try {
      showLoading(true);
      await Agent.agent.credentials.issueSocialMediaCredential(
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
              firstLetter={`${connectionName?.charAt(0)}`}
              rank={0}
            />
            <IonText>{connectionName}</IonText>
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
              Credential Details
            </IonText>
          </IonItem>
          <IonItem lines="none">
            <IonText>
              <span>
                Age Range:
              </span>{" "}
              <span>{`${propDetails?.minAge}-${propDetails?.maxAge}`}</span>
            </IonText>
          </IonItem>
          <IonItem lines="none">
            <IonText>
              <span>
                Screen Time:
              </span>{" "}
              <span>{`${formatScreenTime(propDetails?.screenTimeStart)} - ${formatScreenTime(propDetails?.screenTimeEnd)}`}</span>
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