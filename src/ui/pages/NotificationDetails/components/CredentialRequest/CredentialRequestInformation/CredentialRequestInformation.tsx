import { IonSpinner } from "@ionic/react";
import { checkmarkCircleOutline, warningOutline } from "ionicons/icons";
import { useCallback, useMemo, useState } from "react";
import { Agent } from "../../../../../../core/agent/agent";
import { NotificationRoute } from "../../../../../../core/agent/services/keriaNotificationService.types";
import { i18n } from "../../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../../store/hooks";
import {
  deleteNotificationById,
  getConnectionsCache,
  getCredsArchivedCache,
  getCredsCache,
} from "../../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../../store/reducers/stateCache";
import { Alert, Alert as AlertDecline } from "../../../../../components/Alert";
import {
  CardBlock,
  CardDetailsAttributes,
  CardDetailsContent,
  CardDetailsItem,
} from "../../../../../components/CardDetails";
import { CardTheme } from "../../../../../components/CardTheme";
import { FallbackIcon } from "../../../../../components/FallbackIcon";
import { InfoCard } from "../../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../../components/layout/ScrollablePageLayout";
import { MemberList } from "../../../../../components/MemberList/MemberList";
import {
  Member,
  MemberAcceptStatus,
} from "../../../../../components/MemberList/MemberList.type";
import { PageFooter } from "../../../../../components/PageFooter";
import { PageHeader } from "../../../../../components/PageHeader";
import { SideSlider } from "../../../../../components/SideSlider";
import { Verification } from "../../../../../components/Verification";
import { ToastMsgType } from "../../../../../globals/types";
import { useOnlineStatusEffect } from "../../../../../hooks";
import { showError } from "../../../../../utils/error";
import { combineClassNames } from "../../../../../utils/style";
import { ConnectionDetails } from "../../../../ConnectionDetails";
import { CredentialRequestProps } from "../CredentialRequest.types";
import { LightCredentialDetailModal } from "../LightCredentialDetailModal";
import "./CredentialRequestInformation.scss";

const CredentialRequestInformation = ({
  pageId,
  activeStatus,
  notificationDetails,
  credentialRequest,
  linkedGroup,
  userAID,
  suitableCredentialsCount = 0,
  onBack,
  onAccept,
  onReloadData,
}: CredentialRequestProps) => {
  const dispatch = useAppDispatch();
  const connectionsCache = useAppSelector(getConnectionsCache);
  const credsCache = useAppSelector(getCredsCache);
  const archivedCredsCache = useAppSelector(getCredsArchivedCache);
  const [alertDeclineIsOpen, setAlertDeclineIsOpen] = useState(false);
  const [viewCredId, setViewCredId] = useState<string>();
  const [proposedCredId, setProposedCredId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [showMissingIssuerModal, setShowMissingIssuerModal] = useState(false);
  const [showConnection, setShowConnection] = useState(false);

  const connection = connectionsCache?.find(
    (c) => c.id === notificationDetails.connectionId
  );

  const isGroup = !!linkedGroup;
  const isGroupInitiator = linkedGroup?.members[0] === userAID;
  const isJoinGroup = linkedGroup?.memberInfos.some(
    (item) => item.aid === userAID && item.joined
  );
  const groupInitiatorJoined = !!linkedGroup?.memberInfos.at(0)?.joined;
  const isMemberPendingState =
    !isGroupInitiator && !groupInitiatorJoined && isGroup;
  const isInitiatorJoined = isGroupInitiator && groupInitiatorJoined;

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

    if (isGroup) {
      return i18n.t("tabs.notifications.details.buttons.ok");
    }

    return suitableCredentialsCount > 1
      ? i18n.t("tabs.notifications.details.buttons.choosecredential")
      : i18n.t("tabs.notifications.details.buttons.presentcredential");
  })();

  const memberDeclineButtonText = (() => {
    if (!isGroup) return i18n.t("tabs.notifications.details.buttons.decline");

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

  const displayMember = useMemo(() => {
    const members = linkedGroup?.memberInfos || [];
    const hasAcceptedMember = members.some((item) => item.joined);

    return members.map((item): Member => {
      return {
        name: item.name,
        status: !hasAcceptedMember
          ? MemberAcceptStatus.None
          : item.joined
          ? MemberAcceptStatus.Accepted
          : MemberAcceptStatus.Waiting,
        isCurrentUser: !!item.isCurrentUser,
      };
    });
  }, [linkedGroup?.memberInfos]);

  const openConnection = () => {
    if (!connection) {
      setShowMissingIssuerModal(true);
      return;
    }

    setShowConnection(true);
  };

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
          !(isMemberPendingState || isInitiatorJoined) && (
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
          )
        }
      >
        <div className="credential-content">
          {headerAlertMessage && (
            <InfoCard
              className={combineClassNames(
                "alert",
                reachedThreshold ? "success" : undefined
              )}
              content={headerAlertMessage}
              icon={reachedThreshold ? checkmarkCircleOutline : undefined}
            />
          )}
          {!isGroup && (
            <p className="credential-request-description">
              {i18n.t(
                "tabs.notifications.details.credential.request.information.description"
              )}
            </p>
          )}
          {!isGroupInitiator && groupInitiatorJoined && (
            <CardBlock
              title={`${i18n.t(
                "tabs.notifications.details.credential.request.information.proposalfrom"
              )}`}
              className="request-from"
              showIcon
            >
              <CardDetailsItem
                info={
                  linkedGroup?.memberInfos.at(0)?.name ||
                  i18n.t("tabs.connections.unknown")
                }
                startSlot={<FallbackIcon />}
                className="request-from-content"
              />
            </CardBlock>
          )}
          {linkedGroup?.linkedRequest.current && (
            <>
              <CardBlock
                testId="proposed-cred-card"
                onClick={showProvidedCred}
                className={`${
                  missingProposedCred ? "missing-proposed-cred" : ""
                }`}
                title={`${i18n.t(
                  "tabs.notifications.details.credential.request.information.proposedcred"
                )}`}
              >
                <CardDetailsItem
                  info={
                    credentialRequest.schema.name ||
                    i18n.t("tabs.connections.unknown")
                  }
                  startSlot={<CardTheme className="card-theme" />}
                  className="proposed-cred"
                />
              </CardBlock>
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
          <div
            className={combineClassNames(
              "request-infor",
              isGroup && isGroupInitiator ? "reverse" : undefined
            )}
          >
            <CardBlock
              title={`${i18n.t(
                "tabs.notifications.details.credential.request.information.requestfrom"
              )}`}
              onClick={isGroup ? openConnection : undefined}
            >
              <CardDetailsItem
                info={connection?.label || i18n.t("tabs.connections.unknown")}
                startSlot={<FallbackIcon src={connection?.logo} />}
              />
            </CardBlock>
            <CardBlock
              title={`${i18n.t(
                "tabs.notifications.details.credential.request.information.requestedcredential"
              )}`}
            >
              <CardDetailsItem info={credentialRequest.schema.name} />
            </CardBlock>
          </div>
          {JSON.stringify(credentialRequest.attributes) !== "{}" && (
            <CardBlock
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
            </CardBlock>
          )}
          {linkedGroup && (
            <>
              <CardBlock
                title={`${i18n.t(
                  "tabs.notifications.details.credential.request.information.threshold"
                )}`}
              >
                <CardDetailsContent
                  mainContent={`${linkedGroup.threshold.signingThreshold || 0}`}
                  subContent={`${i18n.t(
                    `tabs.notifications.details.credential.request.information.thresholdcontent`,
                    {
                      members: linkedGroup.members.length || 0,
                    }
                  )}`}
                />
              </CardBlock>
              <CardBlock
                title={i18n.t(
                  "tabs.notifications.details.credential.request.information.groupmember"
                )}
              >
                <MemberList
                  members={displayMember}
                  bottomText={`${i18n.t(
                    `profiledetails.detailsmodal.groupmember.bottomtext`,
                    { members: linkedGroup.members.length || 0 }
                  )}`}
                />
              </CardBlock>
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
      <Alert
        dataTestId="cred-missing-issuer-alert"
        headerText={i18n.t("tabs.credentials.details.alert.missingissuer.text")}
        confirmButtonText={`${i18n.t(
          "tabs.credentials.details.alert.missingissuer.confirm"
        )}`}
        isOpen={showMissingIssuerModal}
        setIsOpen={setShowMissingIssuerModal}
        actionConfirm={closeAlert}
        actionDismiss={closeAlert}
      />
      <SideSlider
        isOpen={showConnection && !!connection}
        renderAsModal
      >
        {connection && (
          <ConnectionDetails
            connectionShortDetails={connection}
            handleCloseConnectionModal={() => setShowConnection(false)}
            restrictedOptions={true}
          />
        )}
      </SideSlider>
    </>
  );
};

export { CredentialRequestInformation };
