import { IonButton, IonIcon } from "@ionic/react";
import {
  checkmarkOutline,
  exitOutline,
  hourglassOutline,
  refreshOutline,
  star,
  warningOutline,
} from "ionicons/icons";
import { useCallback, useMemo, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
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
import { PageHeader } from "../../../../components/PageHeader";
import { Spinner } from "../../../../components/Spinner";
import { SpinnerConverage } from "../../../../components/Spinner/Spinner.type";
import { Verification } from "../../../../components/Verification";
import { ToastMsgType } from "../../../../globals/types";
import { useAppIonRouter, useOnlineStatusEffect } from "../../../../hooks";
import { useProfile } from "../../../../hooks/useProfile";
import { showError } from "../../../../utils/error";
import { combineClassNames } from "../../../../utils/style";
import { Profiles } from "../../../Profiles";
import { StageProps } from "../../SetupGroupProfile.types";
import "./PendingGroup.scss";

const PendingGroup = ({ state }: StageProps) => {
  const componentId = "pending-group";
  const [openProfiles, setOpenProfiles] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [alertDeleteOpen, setAlertDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setRecentProfileAsDefault, defaultProfile } = useProfile();
  const identity = defaultProfile?.identity;
  const dispatch = useAppDispatch();
  const ionRouter = useAppIonRouter();

  const [multisigIcpDetails, setMultisigIcpDetails] =
    useState<GroupInformation | null>(null);

  const handleAvatarClick = () => {
    setOpenProfiles(true);
  };

  const members = useMemo(() => {
    const members = state.selectedConnections?.map((connection) => {
      const name = connection?.label || "";

      return {
        name,
        isCurrentUser: false,
        accepted: !!multisigIcpDetails?.members.find(
          (member) => member.aid === connection.id
        )?.hasAccepted,
      };
    });

    members.unshift({
      name: identity?.groupMetadata?.userName || "",
      isCurrentUser: true,
      accepted:
        multisigIcpDetails?.members.find(
          (item) => item.aid === identity?.groupMemberPre
        )?.hasAccepted || false,
    });

    return members.map((member, index) => ({
      ...member,
      rank: index >= 0 ? index % 5 : 0,
    }));
  }, [
    identity?.groupMemberPre,
    identity?.groupMetadata?.userName,
    multisigIcpDetails?.members,
    state.selectedConnections,
  ]);

  const handleDelete = async () => {
    if (!identity?.id) return;

    try {
      setVerifyIsOpen(false);
      setLoading(true);

      await Agent.agent.identifiers.markIdentifierPendingDelete(identity.id);
      const nextCurrentProfile = await setRecentProfileAsDefault();

      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_DELETED));
      ionRouter.push(
        !nextCurrentProfile || !nextCurrentProfile.groupMetadata
          ? TabsRoutePath.CREDENTIALS
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

  const getDetails = useCallback(async () => {
    if (!identity?.id || !identity?.groupMetadata) return;

    try {
      setLoading(true);
      const details = await Agent.agent.multiSigs.getInceptionStatus(
        identity.id
      );

      setMultisigIcpDetails(details);
    } catch (e) {
      showError("Unable to load group: ", e, dispatch);
    } finally {
      setLoading(false);
    }
  }, [dispatch, identity?.groupMetadata, identity?.id]);

  useOnlineStatusEffect(getDetails);

  const closeAlert = () => setAlertDeleteOpen(false);

  const text = i18n.t("setupgroupprofile.pending.alert.initiatortext");

  return (
    <>
      <ScrollablePageLayout
        pageId={componentId}
        customClass="pending-group"
        header={
          <PageHeader
            title={identity?.groupMetadata?.userName}
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
      >
        <InfoCard
          className="alert"
          icon={warningOutline}
          content={text}
        />
        <ListHeader title={i18n.t("setupgroupprofile.pending.groupinfor")} />
        <CardBlock
          title={i18n.t("setupgroupprofile.initgroup.members")}
          testId="group-member-block"
          className="group-members"
          endSlotIcon={refreshOutline}
          onClick={getDetails}
        >
          {members.map((item, index) => {
            return (
              <CardDetailsItem
                key={index}
                info={item.name}
                startSlot={
                  <MemberAvatar
                    firstLetter={item.name.at(0)?.toLocaleUpperCase() || ""}
                    rank={item.rank}
                  />
                }
                className="member"
                testId={`group-member-${index}`}
                endSlot={
                  <>
                    {item.isCurrentUser && (
                      <div className="user-label">
                        <IonIcon icon={star} />
                        <span>{i18n.t("profiledetails.detailsmodal.you")}</span>
                      </div>
                    )}
                    <div
                      className={combineClassNames(
                        "status",
                        item.accepted ? "accepted" : ""
                      )}
                    >
                      <IonIcon
                        icon={
                          item.accepted ? checkmarkOutline : hourglassOutline
                        }
                      />
                    </div>
                  </>
                }
              />
            );
          })}
          <p className="bottom-text">
            {i18n.t(`setupgroupprofile.initgroup.numberofmember`, {
              members: members?.length || 0,
            })}
          </p>
        </CardBlock>
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
              `setupgroupprofile.initgroup.setsigner.members`,
              {
                members: multisigIcpDetails?.threshold.signingThreshold || 0,
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
              `setupgroupprofile.initgroup.setsigner.members`,
              {
                members: multisigIcpDetails?.threshold.rotationThreshold || 0,
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
        actionConfirm={() => setVerifyIsOpen(true)}
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
    </>
  );
};

export { PendingGroup };
