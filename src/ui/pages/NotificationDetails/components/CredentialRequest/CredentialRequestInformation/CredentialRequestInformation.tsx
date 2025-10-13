import { IonIcon, IonItem, IonSpinner, IonText } from "@ionic/react";
import { chevronForward, warningOutline } from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { RegularConnectionDetails } from "../../../../../../core/agent/agent.types";
import { Agent } from "../../../../../../core/agent/agent";
import { NotificationRoute } from "../../../../../../core/agent/services/keriaNotificationService.types";
import { i18n } from "../../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../../store/hooks";
import {
  getConnectionsCache,
  deleteNotificationById,
  getCredsArchivedCache,
  getCredsCache,
} from "../../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../../store/reducers/stateCache";
import { Alert as AlertDecline } from "../../../../../components/Alert";
import {
  CardDetailsAttributes,
  CardDetailsBlock,
} from "../../../../../components/CardDetails";
import {
  MemberAcceptStatus,
  MultisigMember,
} from "../../../../../components/CredentialDetailModule/components";
import { FallbackIcon } from "../../../../../components/FallbackIcon";
import { InfoCard } from "../../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../../components/PageFooter";
import { PageHeader } from "../../../../../components/PageHeader";
import { Verification } from "../../../../../components/Verification";
import { ToastMsgType } from "../../../../../globals/types";
import { useOnlineStatusEffect } from "../../../../../hooks";
import { showError } from "../../../../../utils/error";
import { CredentialRequestProps, MemberInfo } from "../CredentialRequest.types";
import { LightCredentialDetailModal } from "../LightCredentialDetailModal";
import "./CredentialRequestInformation.scss";
import CitizenPortal from "../../../../../assets/images/citizen-portal.svg";
import KeribloxLogo from "../../../../../assets/images/Keriblox-logo.png";
import Socialbook from "../../../../../assets/images/socialbook.svg";

const CredentialRequestInformation = ({
  pageId,
  activeStatus,
  notificationDetails,
  credentialRequest,
  linkedGroup,
  userAID,
  onBack,
  onAccept,
  onReloadData,
}: CredentialRequestProps) => {
  const dispatch = useAppDispatch();
  const connectionsCache = useAppSelector(
    getConnectionsCache
  ) as RegularConnectionDetails[];
  const credsCache = useAppSelector(getCredsCache);
  const archivedCredsCache = useAppSelector(getCredsArchivedCache);
  const [alertDeclineIsOpen, setAlertDeclineIsOpen] = useState(false);
  const [viewCredId, setViewCredId] = useState<string>();
  const [proposedCredId, setProposedCredId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);

  const connection = connectionsCache?.find(
    (c) => c.id === notificationDetails.connectionId
  );

  const [requester, setRequester] = useState(
    connection?.label || i18n.t("tabs.connections.unknown")
  );

  const isGroup = !!linkedGroup;
  const isGroupInitiator = linkedGroup?.members[0] === userAID;
  const isJoinGroup = linkedGroup?.memberInfos.some(
    (item) => item.aid === userAID && item.joined
  );
  const groupInitiatorJoined = !!linkedGroup?.memberInfos.at(0)?.joined;

  const check = useCallback(async () => {
    const connection = await Agent.agent.connections.getConnectionById(
      notificationDetails.connectionId
    );

    if (connection?.serviceEndpoints[0]) {
      try {
        const url = new URL(connection.serviceEndpoints[0]);
        const typeParam = url.searchParams.get("type");
        const type = typeParam;
        if (type === "guardianship") {
          setRequester("Citizen Portal");
        } else if (type === "socialmedia") {
          setRequester("Socialbook");
        } else if (type === "keriblox") {
          setRequester("Keriblox");
        } else {
          setRequester(connection.label || i18n.t("tabs.connections.unknown"));
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error parsing URL:", error);
        setRequester(connection.label || i18n.t("tabs.connections.unknown"));
      }
    }
  }, [notificationDetails.connectionId]);

  useEffect(() => {
    if (requester === i18n.t("tabs.connections.unknown")) {
      check();
    }
  }, [requester, check]);

  const missingProposedCred = proposedCredId
    ? !(
        credsCache.some((credential) => credential.id === proposedCredId) ||
        archivedCredsCache.some(
          (credential) => credential.id === proposedCredId
        )
      )
    : false;

  const getCred = useCallback(async () => {
    if (!groupInitiatorJoined || !linkedGroup?.linkedRequest.current) return;

    try {
      const id = await Agent.agent.ipexCommunications.getOfferedCredentialSaid(
        linkedGroup.linkedRequest.current
      );
      setProposedCredId(id);
    } catch (error) {
      showError("Unable to get choosen cred", error, dispatch);
    }
  }, [dispatch, groupInitiatorJoined, linkedGroup?.linkedRequest]);

  useOnlineStatusEffect(getCred);

  const handleDecline = async () => {
    const isRejectGroupRequest =
      isGroup &&
      !(
        isGroupInitiator ||
        (!isGroupInitiator && !groupInitiatorJoined) ||
        isJoinGroup
      );
    try {
      await Agent.agent.keriaNotifications.deleteNotificationRecordById(
        notificationDetails.id,
        notificationDetails.a.r as NotificationRoute
      );

      if (isRejectGroupRequest) {
        dispatch(setToastMsg(ToastMsgType.PROPOSAL_CRED_REJECT));
      }

      dispatch(deleteNotificationById(notificationDetails.id));
      onBack();
    } catch (e) {
      const toastMessage = isRejectGroupRequest
        ? ToastMsgType.PROPOSAL_CRED_FAIL
        : undefined;
      showError(
        "Unable to decline credential request",
        e,
        dispatch,
        toastMessage
      );
    }
  };

  const getStatus = useCallback(
    (member: MemberInfo): MemberAcceptStatus => {
      if (member.joined) {
        return MemberAcceptStatus.Accepted;
      }

      if (!groupInitiatorJoined) {
        return MemberAcceptStatus.None;
      }

      return MemberAcceptStatus.Waiting;
    },
    [groupInitiatorJoined]
  );

  const reachedThreshold =
    linkedGroup &&
    linkedGroup.othersJoined.length +
      (linkedGroup.linkedRequest.accepted ? 1 : 0) >=
      Number(linkedGroup.threshold.signingThreshold);

  const showProvidedCred = () => {
    if (missingProposedCred) return;

    setViewCredId(proposedCredId);
  };

  const handleClose = () => setViewCredId(undefined);

  const headerAlertMessage = (() => {
    if (!isGroup) return null;

    if (reachedThreshold) {
      return i18n.t(
        "tabs.notifications.details.credential.request.information.reachthreshold"
      );
    }

    if (isGroupInitiator && !isJoinGroup) {
      return i18n.t(
        "tabs.notifications.details.credential.request.information.initiatorselectcred"
      );
    }

    if (isGroupInitiator && isJoinGroup) {
      return i18n.t(
        "tabs.notifications.details.credential.request.information.initiatorselectedcred"
      );
    }

    if (!isGroupInitiator && !isJoinGroup && !groupInitiatorJoined) {
      return i18n.t(
        "tabs.notifications.details.credential.request.information.memberwaitingproposal"
      );
    }

    if (!isGroupInitiator && !isJoinGroup) {
      return i18n.t(
        "tabs.notifications.details.credential.request.information.memberreviewcred"
      );
    }

    if (!isGroupInitiator && isJoinGroup) {
      return i18n.t(
        "tabs.notifications.details.credential.request.information.memberjoined"
      );
    }

    return null;
  })();

  const primaryButtonText = (() => {
    if (isGroupInitiator) {
      return groupInitiatorJoined
        ? i18n.t("tabs.notifications.details.buttons.ok")
        : i18n.t("tabs.notifications.details.buttons.choosecredential");
    }

    if (
      groupInitiatorJoined &&
      !isJoinGroup &&
      !reachedThreshold &&
      !missingProposedCred
    ) {
      return i18n.t("tabs.notifications.details.buttons.accept");
    }

    return i18n.t("tabs.notifications.details.buttons.ok");
  })();

  const memberDeclineButtonText = (() => {
    return isGroupInitiator ||
      (!isGroupInitiator && !groupInitiatorJoined) ||
      isJoinGroup ||
      reachedThreshold ||
      missingProposedCred
      ? undefined
      : `${i18n.t("tabs.notifications.details.buttons.decline")}`;
  })();

  const groupInitiatorDeclineButtonText =
    reachedThreshold ||
    groupInitiatorJoined ||
    !isGroupInitiator ||
    missingProposedCred
      ? undefined
      : `${i18n.t("tabs.notifications.details.buttons.decline")}`;

  const decline = () => setAlertDeclineIsOpen(true);

  const acceptRequest = async () => {
    try {
      setLoading(true);
      await Agent.agent.ipexCommunications.joinMultisigOffer(
        notificationDetails.id
      );
      dispatch(setToastMsg(ToastMsgType.PROPOSAL_CRED_ACCEPTED));
      await onReloadData?.();
    } catch (e) {
      showError(
        "Unable to proposal cred",
        e,
        dispatch,
        ToastMsgType.PROPOSAL_CRED_FAIL
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptClick = async () => {
    if ((isGroupInitiator && !isJoinGroup) || !isGroup) {
      onAccept();
      return;
    }

    if (
      isJoinGroup ||
      !groupInitiatorJoined ||
      reachedThreshold ||
      missingProposedCred
    ) {
      onBack();
      return;
    }

    setVerifyIsOpen(true);
  };

  const closeAlert = () => setAlertDeclineIsOpen(false);

  const title = `${i18n.t(
    isGroup && !isGroupInitiator && groupInitiatorJoined
      ? "tabs.notifications.details.credential.request.information.proposedcred"
      : "tabs.notifications.details.credential.request.information.title"
  )}`;

  const logo = (() => {
    if (requester === "Citizen Portal") {
      return (
        <div className="citizen-portal-logo-container">
          <img
            src={CitizenPortal}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    if (requester === "Socialbook") {
      return (
        <div className="socialbook-logo-container">
          <img
            src={Socialbook}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    if (requester === "Keriblox") {
      return (
        <div className="socialbook-logo-container">
          <img
            src={KeribloxLogo}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    return <FallbackIcon src={connection?.logo} />;
  })();

  return (
    <>
      <ScrollablePageLayout
        pageId={`${pageId}-credential-request-info`}
        customClass={`${pageId}-credential-request-info`}
        activeStatus={activeStatus}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={onBack}
            closeButtonLabel={`${i18n.t(
              "tabs.notifications.details.buttons.close"
            )}`}
            title={title}
          />
        }
        footer={
          <PageFooter
            pageId={pageId}
            customClass="credential-request-footer"
            primaryButtonText={primaryButtonText}
            primaryButtonAction={handleAcceptClick}
            declineButtonText={
              groupInitiatorDeclineButtonText || memberDeclineButtonText
            }
            declineButtonAction={decline}
          />
        }
      >
        <div className="credential-content">
          {headerAlertMessage && (
            <InfoCard
              className="alert"
              content={headerAlertMessage}
            />
          )}
          {!isGroupInitiator && groupInitiatorJoined && (
            <CardDetailsBlock
              className="request-from"
              title={`${i18n.t(
                "tabs.notifications.details.credential.request.information.proposalfrom"
              )}`}
            >
              <div className="request-from-content">
                <FallbackIcon />
                <p>
                  {linkedGroup?.memberInfos.at(0)?.name ||
                    i18n.t("tabs.connections.unknown")}
                </p>
              </div>
            </CardDetailsBlock>
          )}
          {linkedGroup?.linkedRequest.current && (
            <>
              <CardDetailsBlock
                dataTestId="proposed-cred"
                onClick={showProvidedCred}
                className={`proposed-cred ${
                  missingProposedCred ? "missing-proposed-cred" : ""
                }`}
                title={`${i18n.t(
                  "tabs.notifications.details.credential.request.information.proposedcred"
                )}`}
              >
                <div className="request-from-content">
                  <FallbackIcon />
                  <p>
                    {credentialRequest.schema.name ||
                      i18n.t("tabs.connections.unknown")}
                  </p>
                </div>
                {missingProposedCred ? (
                  <></>
                ) : (
                  <IonIcon icon={chevronForward} />
                )}
              </CardDetailsBlock>
              {missingProposedCred ? (
                <InfoCard
                  content={i18n.t(
                    isGroupInitiator
                      ? "tabs.notifications.details.credential.request.information.initiatordeletedproposedcredential"
                      : "tabs.notifications.details.credential.request.information.missingproposedcredential"
                  )}
                  className="missing-proposed-cred-info"
                  icon={warningOutline}
                />
              ) : (
                <></>
              )}
            </>
          )}
          <CardDetailsBlock className="request-from">
            <IonItem
              lines="none"
              className="request-from-label"
            >
              <IonText>
                {i18n.t(
                  "tabs.notifications.details.credential.request.information.requestfrom"
                )}
              </IonText>
            </IonItem>
            <div className="request-from-content">
              {logo}
              <p>{requester}</p>
            </div>
          </CardDetailsBlock>
          <CardDetailsBlock className="credential-request">
            <IonItem
              lines="none"
              className="request-from-label"
            >
              <IonText>
                {i18n.t(
                  "tabs.notifications.details.credential.request.information.requestedcredential"
                )}
              </IonText>
            </IonItem>
            <IonText className="requested-credential">
              {credentialRequest.schema.name}
            </IonText>
          </CardDetailsBlock>
          {JSON.stringify(credentialRequest.attributes) !== "{}" && (
            <CardDetailsBlock className="request-data">
              <IonItem
                lines="none"
                className="request-from-label"
              >
                <IonText>
                  {i18n.t(
                    "tabs.notifications.details.credential.request.information.informationrequired"
                  )}
                </IonText>
              </IonItem>
              <CardDetailsAttributes
                data={credentialRequest.attributes as Record<string, string>}
                itemProps={{
                  mask: false,
                  fullText: true,
                  copyButton: false,
                  className: "credential-info-item",
                }}
              />
            </CardDetailsBlock>
          )}
          {linkedGroup && (
            <>
              <CardDetailsBlock
                className="credential-request"
                title={`${i18n.t(
                  "tabs.notifications.details.credential.request.information.threshold"
                )}`}
              >
                <div className="threshold">
                  <IonText className="requested-credential">
                    {linkedGroup.threshold.signingThreshold}
                  </IonText>
                </div>
              </CardDetailsBlock>
              <CardDetailsBlock
                className="group-members"
                title={i18n.t(
                  "tabs.notifications.details.credential.request.information.groupmember"
                )}
              >
                {linkedGroup.memberInfos.map((member) => (
                  <MultisigMember
                    key={member.aid}
                    name={member.name}
                    status={getStatus(member)}
                  />
                ))}
              </CardDetailsBlock>
            </>
          )}
        </div>
      </ScrollablePageLayout>
      <LightCredentialDetailModal
        credId={viewCredId || ""}
        isOpen={!!viewCredId}
        setIsOpen={handleClose}
        onClose={handleClose}
        joinedCredRequestMembers={linkedGroup?.memberInfos}
        viewOnly
      />
      <AlertDecline
        isOpen={alertDeclineIsOpen}
        setIsOpen={setAlertDeclineIsOpen}
        dataTestId="multisig-request-alert-decline"
        headerText={i18n.t(
          "tabs.notifications.details.credential.request.information.alert.textdecline"
        )}
        confirmButtonText={`${i18n.t(
          "tabs.notifications.details.buttons.decline"
        )}`}
        cancelButtonText={`${i18n.t(
          "tabs.notifications.details.buttons.cancel"
        )}`}
        actionConfirm={handleDecline}
        actionCancel={closeAlert}
        actionDismiss={closeAlert}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={acceptRequest}
      />
      {loading && (
        <div
          className="credential-request-spinner-container"
          data-testid="credential-request-spinner-container"
        >
          <IonSpinner name="circular" />
        </div>
      )}
    </>
  );
};

export { CredentialRequestInformation };
