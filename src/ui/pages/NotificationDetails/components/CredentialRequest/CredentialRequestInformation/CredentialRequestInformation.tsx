import { IonIcon, IonSpinner, IonText } from "@ionic/react";
import { chevronForward, warningOutline } from "ionicons/icons";
import { useCallback, useState } from "react";
import { Agent } from "../../../../../../core/agent/agent";
import { NotificationRoute } from "../../../../../../core/agent/services/keriaNotificationService.types";
import { i18n } from "../../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../../store/hooks";
import { getConnectionsCache } from "../../../../../../store/reducers/connectionsCache";
import { getCredsArchivedCache } from "../../../../../../store/reducers/credsArchivedCache";
import { getCredsCache } from "../../../../../../store/reducers/credsCache";
import {
  getNotificationsCache,
  setNotificationsCache,
} from "../../../../../../store/reducers/notificationsCache";
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
  const notificationsCache = useAppSelector(getNotificationsCache);
  const connectionsCache = useAppSelector(getConnectionsCache);
  const credsCache = useAppSelector(getCredsCache);
  const archivedCredsCache = useAppSelector(getCredsArchivedCache);
  const [notifications, setNotifications] = useState(notificationsCache);
  const [alertDeclineIsOpen, setAlertDeclineIsOpen] = useState(false);
  const [viewCredId, setViewCredId] = useState<string>();
  const [proposedCredId, setProposedCredId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);

  const connection = connectionsCache?.[notificationDetails.connectionId];

  const isGroup = !!linkedGroup;
  const isGroupInitiator = linkedGroup?.members[0] === userAID;
  const isJoinGroup = linkedGroup?.memberInfos.some(
    (item) => item.aid === userAID && item.joined
  );
  const groupInitiatorJoined = !!linkedGroup?.memberInfos.at(0)?.joined;

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

  const handleNotificationUpdate = async () => {
    const updatedNotifications = notifications.filter(
      (notification) => notification.id !== notificationDetails.id
    );
    setNotifications(updatedNotifications);
    dispatch(setNotificationsCache(updatedNotifications));
  };

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

      handleNotificationUpdate();
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
      Number(linkedGroup.threshold);

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
                    i18n.t("connections.unknown")}
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
                      i18n.t("connections.unknown")}
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
          <CardDetailsBlock
            className="request-from"
            title={`${i18n.t(
              "tabs.notifications.details.credential.request.information.requestfrom"
            )}`}
          >
            <div className="request-from-content">
              <FallbackIcon src={connection?.logo} />
              <p>{connection?.label || i18n.t("connections.unknown")}</p>
            </div>
          </CardDetailsBlock>
          <CardDetailsBlock
            className="credential-request"
            title={`${i18n.t(
              "tabs.notifications.details.credential.request.information.requestedcredential"
            )}`}
          >
            <IonText className="requested-credential">
              {credentialRequest.schema.name}
            </IonText>
          </CardDetailsBlock>
          {JSON.stringify(credentialRequest.attributes) !== "{}" && (
            <CardDetailsBlock
              className="request-data"
              title={i18n.t(
                "tabs.notifications.details.credential.request.information.informationrequired"
              )}
            >
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
                    {linkedGroup.threshold}
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
