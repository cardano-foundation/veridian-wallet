import { IonButton, IonIcon } from "@ionic/react";
import {
  exitOutline,
  qrCodeOutline,
  refreshOutline,
  warningOutline,
} from "ionicons/icons";
import { useCallback, useMemo, useRef, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import {
  ConnectionShortDetails,
  CreationStatus,
} from "../../../../../core/agent/agent.types";
import { MultiSigService } from "../../../../../core/agent/services";
import { MultiSigIcpRequestDetails } from "../../../../../core/agent/services/identifier.types";
import { NotificationRoute } from "../../../../../core/agent/services/keriaNotificationService.types";
import { GroupInformation } from "../../../../../core/agent/services/multiSig.types";
import { i18n } from "../../../../../i18n";
import { RoutePath, TabsRoutePath } from "../../../../../routes/paths";
import { useAppDispatch } from "../../../../../store/hooks";
import { removeProfile } from "../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { Alert } from "../../../../components/Alert";
import { Avatar, MemberAvatar } from "../../../../components/Avatar";
import {
  CardBlock,
  CardDetailsContent,
  CardDetailsItem,
  FlatBorderType,
} from "../../../../components/CardDetails";
import { InfoCard } from "../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { ListHeader } from "../../../../components/ListHeader";
import { MemberList } from "../../../../components/MemberList";
import { MemberAcceptStatus } from "../../../../components/MemberList/MemberList.type";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { ShareProfile } from "../../../../components/ShareProfile";
import { Spinner } from "../../../../components/Spinner";
import { SpinnerConverage } from "../../../../components/Spinner/Spinner.type";
import { Verification } from "../../../../components/Verification";
import { ToastMsgType } from "../../../../globals/types";
import { useAppIonRouter, useOnlineStatusEffect } from "../../../../hooks";
import { useProfile } from "../../../../hooks/useProfile";
import { showError } from "../../../../utils/error";
import { Profiles } from "../../../Profiles";
import { StageProps } from "../../SetupGroupProfile.types";
import { ErrorPage } from "./ErrorPage";
import "./PendingGroup.scss";

const PendingGroup = ({ state, isPendingGroup }: StageProps) => {
  const componentId = "pending-group";
  const [openProfiles, setOpenProfiles] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [alertDeleteOpen, setAlertDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertDeclineIsOpen, setAlertDeclineIsOpen] = useState(false);
  const { setRecentProfileAsDefault, defaultProfile } = useProfile();
  const identity = defaultProfile?.identity;
  const dispatch = useAppDispatch();
  const ionRouter = useAppIonRouter();
  const [multisigIcpDetails, setMultisigIcpDetails] =
    useState<MultiSigIcpRequestDetails | null>(null);
  const retry = useRef(0);
  const [showErrorPage, setShowErrorPage] = useState(false);
  const [shareProfile, setShareProfile] = useState(false);
  const [oobi, setOobi] = useState("");

  const initGroupNotification = defaultProfile?.notifications.find(
    (item) => item.a.r === NotificationRoute.MultiSigIcp
  );

  const [groupDetails, setGroupDetails] = useState<GroupInformation | null>(
    null
  );

  const isPendingMember = !!initGroupNotification;

  const rotationThreshold = isPendingMember
    ? multisigIcpDetails?.rotationThreshold
    : groupDetails?.threshold.rotationThreshold;
  const signingThreshold = isPendingMember
    ? multisigIcpDetails?.signingThreshold
    : groupDetails?.threshold.signingThreshold;

  const handleAvatarClick = () => {
    setOpenProfiles(true);
  };

  const fetchOobi = useCallback(async () => {
    if (
      identity?.creationStatus === CreationStatus.COMPLETE &&
      !!identity?.groupMemberPre
    )
      return;

    const alias =
      identity?.groupMetadata?.proposedUsername || identity?.groupUsername;
    const groupId = defaultProfile?.multisigConnections[0]?.groupId;
    const groupName = identity?.displayName;
    const identityId = identity?.groupMemberPre || identity?.id;

    if (!alias || !groupId || !groupName || !identityId) return;

    try {
      const oobiValue = await Agent.agent.connections.getOobi(identityId, {
        alias,
        groupId,
        groupName,
      });
      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      dispatch(setToastMsg(ToastMsgType.UNKNOWN_ERROR));
    }
  }, [
    defaultProfile?.multisigConnections,
    dispatch,
    identity?.creationStatus,
    identity?.displayName,
    identity?.groupMemberPre,
    identity?.groupMetadata?.proposedUsername,
    identity?.groupUsername,
    identity?.id,
  ]);

  useOnlineStatusEffect(fetchOobi);

  const getMemberName = useCallback(
    (connections: ConnectionShortDetails[], id: string) => {
      return connections.find((con) => con.id === id)?.label;
    },
    []
  );

  const members = useMemo(() => {
    const members = [];

    if (isPendingMember && multisigIcpDetails) {
      for (const member of [
        multisigIcpDetails.sender,
        ...multisigIcpDetails.otherConnections,
      ]) {
        members.push({
          name: member.label,
          isCurrentUser: false,
          status: member.hasAccepted
            ? MemberAcceptStatus.Accepted
            : MemberAcceptStatus.Waiting,
        });
      }
    } else {
      for (const member of groupDetails?.members || []) {
        const memberName = getMemberName(state.scannedConections, member.aid);

        if (memberName) {
          members.push({
            name: memberName,
            isCurrentUser: false,
            status: member.hasAccepted
              ? MemberAcceptStatus.Accepted
              : MemberAcceptStatus.Waiting,
          });
        }
      }
    }

    members.unshift({
      name:
        identity?.groupUsername ||
        identity?.groupMetadata?.proposedUsername ||
        "",
      isCurrentUser: true,
      status: groupDetails?.members.find(
        (item) => item.aid === identity?.groupMemberPre
      )?.hasAccepted
        ? MemberAcceptStatus.Accepted
        : MemberAcceptStatus.Waiting,
    });

    const mapped = members.map((member, index) => ({
      ...member,
      avatar: (
        <MemberAvatar
          firstLetter={member.name.at(0)?.toLocaleUpperCase() || ""}
          rank={index >= 0 ? index % 5 : 0}
        />
      ),
    }));
    return mapped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.selectedConnections,
    identity?.groupUsername,
    identity?.groupMetadata?.proposedUsername,
    identity?.groupMemberPre,
    groupDetails?.members,
    isPendingMember,
    multisigIcpDetails?.sender.id,
    multisigIcpDetails?.otherConnections,
  ]);

  const handleDelete = async () => {
    if (!identity?.id) return;

    try {
      setVerifyIsOpen(false);
      setLoading(true);
      setAlertDeclineIsOpen(false);

      await Agent.agent.identifiers.markIdentifierPendingDelete(identity.id);

      if (initGroupNotification) {
        await Agent.agent.keriaNotifications.deleteNotificationRecordById(
          initGroupNotification.id,
          initGroupNotification.a.r as NotificationRoute
        );
      }

      const nextCurrentProfile = await setRecentProfileAsDefault();

      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_DELETED));
      ionRouter.push(
        !nextCurrentProfile || !nextCurrentProfile.groupMetadata
          ? TabsRoutePath.HOME
          : RoutePath.GROUP_PROFILE_SETUP.replace(":id", nextCurrentProfile.id)
      );
      // Waiting
      setTimeout(() => {
        dispatch(removeProfile(identity.id));
      }, 500);
    } catch (e) {
      showError(
        "Unable to delete identifier",
        e,
        dispatch,
        ToastMsgType.DELETE_IDENTIFIER_FAIL
      );
    } finally {
      setLoading(false);
    }
  };

  const getInceptionStatus = useCallback(async () => {
    if (!identity?.id) return;

    try {
      setLoading(true);
      const details = await Agent.agent.multiSigs.getInceptionStatus(
        identity.id
      );
      retry.current = 0;
      setGroupDetails(details);
    } catch (e) {
      if (
        e instanceof Error &&
        e.message === MultiSigService.CANNOT_FIND_EXCHANGES &&
        retry.current < 3
      ) {
        setTimeout(() => {
          retry.current += 1;
          getInceptionStatus();
        }, 100);
        return;
      }

      showError("Unable to load group: ", e, dispatch);
    } finally {
      setLoading(false);
    }
  }, [dispatch, identity?.id]);

  const fetchMultisigDetails = useCallback(async () => {
    try {
      if (!initGroupNotification) return;
      setLoading(true);
      const details = await Agent.agent.multiSigs.getMultisigIcpDetails(
        initGroupNotification.a.d as string
      );
      setMultisigIcpDetails(details);
      setShowErrorPage(false);
    } catch (e) {
      if (
        (e as Error).message === MultiSigService.UNKNOWN_AIDS_IN_MULTISIG_ICP
      ) {
        setShowErrorPage(true);
      }
    } finally {
      setLoading(false);
    }
  }, [initGroupNotification]);

  const fetchGroupDetails = useCallback(async () => {
    if (!isPendingGroup) return;

    if (isPendingMember) {
      await fetchMultisigDetails();
      return;
    }

    await getInceptionStatus();
  }, [
    fetchMultisigDetails,
    getInceptionStatus,
    isPendingGroup,
    isPendingMember,
  ]);

  useOnlineStatusEffect(fetchGroupDetails);

  const joinGroup = async () => {
    if (!initGroupNotification) return;
    setLoading(true);
    try {
      if (!multisigIcpDetails) {
        throw new Error(
          "Cannot accept a multi-sig inception event before details are loaded from core"
        );
      }

      await Agent.agent.multiSigs.joinGroup(
        initGroupNotification.id,
        initGroupNotification.a.d as string
      );

      dispatch(setToastMsg(ToastMsgType.ACCEPT_SUCCESS));
    } catch (e) {
      showError(
        "Unable to join multi-sig",
        e,
        dispatch,
        ToastMsgType.UNABLE_TO_ACCEPT
      );
    } finally {
      setLoading(false);
    }
  };

  const closeAlert = () => setAlertDeleteOpen(false);
  const closeDeclineAlert = () => setAlertDeclineIsOpen(false);
  const openDeclineAlert = () => setAlertDeclineIsOpen(true);
  const showVerify = () => setVerifyIsOpen(true);
  const intiatorName =
    multisigIcpDetails?.sender.label ||
    (groupDetails
      ? getMemberName(state.scannedConections, groupDetails.members[0].aid)
      : "");

  const text = isPendingMember
    ? i18n.t("setupgroupprofile.pending.alert.membertext")
    : i18n.t("setupgroupprofile.pending.alert.initiatortext");

  if (showErrorPage && initGroupNotification && defaultProfile) {
    return (
      <ErrorPage
        pageId={componentId}
        activeStatus
        notificationDetails={initGroupNotification}
        onFinishSetup={fetchMultisigDetails}
        profile={defaultProfile}
        oobi={oobi}
        groupMembers={members}
        handleLeaveGroup={handleDelete}
      />
    );
  }

  return (
    <>
      <ScrollablePageLayout
        pageId={componentId}
        customClass="pending-group"
        header={
          <PageHeader
            title={
              identity?.groupUsername ||
              identity?.groupMetadata?.proposedUsername
            }
            additionalButtons={
              identity?.id && (
                <Avatar
                  id={identity?.id}
                  handleAvatarClick={handleAvatarClick}
                />
              )
            }
          />
        }
        footer={
          isPendingMember && (
            <PageFooter
              pageId={componentId}
              primaryButtonAction={joinGroup}
              primaryButtonText={`${i18n.t(
                "setupgroupprofile.pending.button.accept"
              )}`}
              tertiaryButtonAction={openDeclineAlert}
              tertiaryButtonText={`${i18n.t(
                "setupgroupprofile.pending.button.decline"
              )}`}
            />
          )
        }
      >
        <InfoCard
          className="alert"
          icon={warningOutline}
          content={text}
        />
        <ListHeader title={i18n.t("setupgroupprofile.pending.groupinfor")} />
        {intiatorName && (
          <CardBlock
            title={i18n.t("setupgroupprofile.pending.request")}
            testId="request-from"
            className="request-from"
          >
            <CardDetailsItem
              startSlot={
                <MemberAvatar
                  firstLetter={intiatorName.at(0)?.toLocaleUpperCase() || ""}
                  rank={0}
                />
              }
              className="member"
              info={intiatorName}
            />
          </CardBlock>
        )}
        <CardBlock
          title={i18n.t("setupgroupprofile.initgroup.members")}
          testId="group-member-block"
          className="group-members"
          endSlotIcon={refreshOutline}
          onClick={fetchGroupDetails}
        >
          <MemberList
            members={members}
            bottomText={`${i18n.t(
              `setupgroupprofile.initgroup.numberofmember`,
              {
                members: members?.length || 0,
              }
            )}`}
          />
        </CardBlock>
        <IonButton
          shape="round"
          expand="block"
          fill="outline"
          className="secondary-button share-profile-button"
          data-testid="share-profile"
          onClick={() => {
            setShareProfile(true);
          }}
        >
          <IonIcon
            slot="icon-only"
            size="small"
            icon={qrCodeOutline}
            color="primary"
          />
          {i18n.t("setupgroupprofile.pending.button.share")}
        </IonButton>
        <CardBlock
          flatBorder={FlatBorderType.BOT}
          title={i18n.t(
            "setupgroupprofile.initgroup.setsigner.requiredsigners"
          )}
          testId="required-signer-block"
          className="required-signer"
        >
          <CardDetailsContent
            testId="required-signer-key"
            mainContent={`${i18n.t(
              `setupgroupprofile.initgroup.setsigner.${
                (signingThreshold || 0) > 1 ? "members" : "member"
              }`,
              {
                members: signingThreshold || 0,
              }
            )}`}
          />
        </CardBlock>
        <CardBlock
          className="recovery-signer"
          title={i18n.t(
            "setupgroupprofile.initgroup.setsigner.recoverysigners"
          )}
          flatBorder={FlatBorderType.TOP}
          testId="recovery-signer-block"
        >
          <CardDetailsContent
            testId="recovery-signer-key"
            mainContent={`${i18n.t(
              `setupgroupprofile.initgroup.setsigner.${
                (rotationThreshold || 0) > 1 ? "members" : "member"
              }`,
              {
                members: rotationThreshold || 0,
              }
            )}`}
          />
        </CardBlock>
        <IonButton
          shape="round"
          expand="block"
          fill="clear"
          className="delete-button"
          data-testid="delete-button-initiate-multi-sig"
          onClick={() => setAlertDeleteOpen(true)}
        >
          <IonIcon
            slot="icon-only"
            size="small"
            icon={exitOutline}
            color="primary"
          />
          {i18n.t("setupgroupprofile.pending.leave.button")}
        </IonButton>
      </ScrollablePageLayout>
      <Spinner
        show={loading}
        coverage={SpinnerConverage.Screen}
      />
      <Alert
        isOpen={alertDeleteOpen}
        setIsOpen={setAlertDeleteOpen}
        dataTestId="alert-confirm-identifier-delete-details"
        headerText={i18n.t("setupgroupprofile.pending.leave.alert.title")}
        confirmButtonText={`${i18n.t(
          "setupgroupprofile.pending.leave.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "setupgroupprofile.pending.leave.alert.cancel"
        )}`}
        actionConfirm={showVerify}
        actionCancel={closeAlert}
        actionDismiss={closeAlert}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleDelete}
      />
      <Profiles
        isOpen={openProfiles}
        setIsOpen={setOpenProfiles}
      />
      <ShareProfile
        isOpen={shareProfile}
        setIsOpen={setShareProfile}
        hiddenScan
        oobi={oobi}
      />
      <Alert
        isOpen={alertDeclineIsOpen}
        setIsOpen={setAlertDeclineIsOpen}
        dataTestId="multisig-request-alert-decline"
        headerText={i18n.t("setupgroupprofile.pending.decline.alert.title")}
        confirmButtonText={`${i18n.t(
          "setupgroupprofile.pending.decline.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "setupgroupprofile.pending.decline.alert.cancel"
        )}`}
        actionConfirm={showVerify}
        actionCancel={closeDeclineAlert}
        actionDismiss={closeDeclineAlert}
      />
    </>
  );
};

export { PendingGroup };
