import { IonButton, IonIcon, IonText } from "@ionic/react";
import { alertCircleOutline, exitOutline, qrCodeOutline } from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { Agent } from "../../../../../core/agent/agent";
import {
  isMultisigConnectionDetails,
  OobiType,
} from "../../../../../core/agent/agent.types";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getMultisigConnectionsCache,
  updateOrAddMultisigConnectionCache,
} from "../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { Alert } from "../../../../components/Alert";
import { Avatar } from "../../../../components/Avatar";
import {
  CardBlock,
  CardDetailsBlock,
  CardDetailsContent,
} from "../../../../components/CardDetails";
import { InfoCard } from "../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { MemberList } from "../../../../components/MemberList";
import { MemberAcceptStatus } from "../../../../components/MemberList/MemberList.type";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { useScanHandle } from "../../../../components/Scan/hook/useScanHandle";
import { ShareProfile } from "../../../../components/ShareProfile";
import { Tab } from "../../../../components/ShareProfile/ShareProfile.types";
import { Verification } from "../../../../components/Verification";
import { SUPPORT_EMAIL } from "../../../../globals/constants";
import { ToastMsgType } from "../../../../globals/types";
import { showError } from "../../../../utils/error";
import { Profiles } from "../../../Profiles";
import "./ErrorPage.scss";
import { ErrorPageProps } from "./ErrorPage.types";

const ErrorPage = ({
  pageId,
  activeStatus,
  notificationDetails,
  profile,
  oobi,
  groupMembers = [],
  handleLeaveGroup,
  onFinishSetup,
}: ErrorPageProps) => {
  const connectionsCache = useAppSelector(getMultisigConnectionsCache);
  const [showShareProfile, setShowShareProfile] = useState(false);
  const [alertDeleteOpen, setAlertDeleteOpen] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [openProfiles, setOpenProfiles] = useState(false);
  const [totalMember, setTotalMember] = useState(0);
  const identity = profile.identity;

  const { resolveGroupConnection } = useScanHandle();
  const dispatch = useAppDispatch();

  const isConnectAllMember =
    profile.multisigConnections.length === totalMember - 1;

  const actionAccept = () => {
    if (isConnectAllMember) {
      onFinishSetup();
      return;
    }

    setShowShareProfile(true);
  };

  const HandleEmail = () => {
    return (
      <a
        data-testid="support-link-browser-handler"
        href={SUPPORT_EMAIL}
      >
        {i18n.t(
          "tabs.notifications.details.identifier.errorpage.help.emailaddress"
        )}
      </a>
    );
  };

  useEffect(() => {
    const getTotalMember = async () => {
      try {
        const totalMember = await Agent.agent.multiSigs.getGroupSizeFromIcpExn(
          notificationDetails.a.d as string
        );
        setTotalMember(totalMember);
      } catch (e) {
        showError("Failed to get total member", e, dispatch);
      }
    };

    getTotalMember();
  }, [dispatch, notificationDetails.a.d]);

  const handleCloseScan = () => {
    setShowShareProfile(false);
  };

  const handleScan = useCallback(
    async (content: string, registerScanHandler?: () => Promise<void>) => {
      if (
        connectionsCache.some((item) => item.oobi === content) ||
        !profile.identity.groupMetadata
      )
        return;

      const invitation = await resolveGroupConnection(
        content,
        profile.identity.groupMetadata.groupId,
        handleCloseScan,
        registerScanHandler,
        handleCloseScan
      );

      if (!invitation) return;

      if (isMultisigConnectionDetails(invitation.connection)) {
        dispatch(updateOrAddMultisigConnectionCache(invitation.connection));
      }

      if (invitation.type === OobiType.NORMAL) {
        dispatch(setToastMsg(ToastMsgType.NEW_MULTI_SIGN_MEMBER));
      }
    },
    [
      connectionsCache,
      dispatch,
      profile.identity.groupMetadata,
      resolveGroupConnection,
    ]
  );

  const closeAlert = () => setAlertDeleteOpen(false);
  const showVerify = () => setVerifyIsOpen(true);
  const handleAvatarClick = () => {
    setOpenProfiles(true);
  };

  const primaryButtonLabel =
    totalMember > 0 && isConnectAllMember
      ? i18n.t("tabs.notifications.details.identifier.errorpage.continuesetup")
      : i18n.t("tabs.notifications.details.identifier.errorpage.addmember");

  return (
    <>
      <ScrollablePageLayout
        pageId="error-feedback"
        customClass="error-feedback setup-identifier"
        activeStatus={activeStatus}
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
          <PageFooter
            pageId={pageId}
            customClass="error-feedback-footer"
            primaryButtonText={primaryButtonLabel}
            primaryButtonAction={actionAccept}
            primaryButtonIcon={isConnectAllMember ? undefined : qrCodeOutline}
          />
        }
      >
        {!isConnectAllMember && (
          <InfoCard
            className="alert"
            content={i18n.t(
              "tabs.notifications.details.identifier.errorpage.alerttext"
            )}
            icon={alertCircleOutline}
          />
        )}
        <CardBlock
          className="total-member"
          title={i18n.t(
            "tabs.notifications.details.identifier.errorpage.groupmember"
          )}
          testId="group-member-block"
        >
          <CardDetailsContent
            mainContent={`${i18n.t(
              "tabs.notifications.details.identifier.errorpage.member",
              {
                member: totalMember,
              }
            )}`}
          />
        </CardBlock>
        <CardBlock
          title={i18n.t(
            "tabs.notifications.details.identifier.errorpage.connectedmember"
          )}
          testId="group-member-block"
          className="group-members"
        >
          <MemberList
            members={groupMembers.map((member) => ({
              ...member,
              status: MemberAcceptStatus.None,
              isCurrentUser: false,
            }))}
            bottomText={`${i18n.t(
              "tabs.notifications.details.identifier.errorpage.listmember",
              {
                currentMembers: groupMembers?.length || 0,
                totalMembers: totalMember,
              }
            )}`}
          />
        </CardBlock>
        <div className="instructions">
          <h2 className="title">
            {i18n.t(
              "tabs.notifications.details.identifier.errorpage.instructions.title"
            )}
          </h2>
          <IonText className="detail-text">
            {i18n.t(
              "tabs.notifications.details.identifier.errorpage.instructions.detailtext"
            )}
          </IonText>
          <CardDetailsBlock className="content">
            <ol className="instruction-list">
              <li>
                {i18n.t(
                  "tabs.notifications.details.identifier.errorpage.instructions.stepone"
                )}
              </li>
              <li>
                {i18n.t(
                  "tabs.notifications.details.identifier.errorpage.instructions.steptwo"
                )}
              </li>
            </ol>
          </CardDetailsBlock>
        </div>
        <div className="help">
          <h2 className="title">
            {i18n.t(
              "tabs.notifications.details.identifier.errorpage.help.title"
            )}
          </h2>
          <IonText className="detail-text">
            <Trans
              i18nKey={i18n.t(
                "tabs.notifications.details.identifier.errorpage.help.detailtext"
              )}
              components={[<HandleEmail key="" />]}
            />
          </IonText>
        </div>
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
        onVerify={handleLeaveGroup}
      />
      <ShareProfile
        isOpen={showShareProfile}
        setIsOpen={setShowShareProfile}
        defaultTab={Tab.Scan}
        oobi={oobi}
        onScan={handleScan}
      />
      <Profiles
        isOpen={openProfiles}
        setIsOpen={setOpenProfiles}
      />
    </>
  );
};

export { ErrorPage };
