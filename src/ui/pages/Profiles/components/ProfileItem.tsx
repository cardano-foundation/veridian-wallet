import { IonChip, IonIcon } from "@ionic/react";
import { createSelector } from "@reduxjs/toolkit";
import { hourglassOutline, warningOutline } from "ionicons/icons";
import { CreationStatus } from "../../../../core/agent/agent.types";
import {
  KeriaNotification,
  NotificationRoute,
} from "../../../../core/agent/services/keriaNotificationService.types";
import { i18n } from "../../../../i18n";
import { RootState } from "../../../../store";
import { useAppSelector } from "../../../../store/hooks";
import { Avatar } from "../../../components/Avatar";
import { BubbleCounter } from "../../../components/BubbleCounter";
import { ProfileItemsProps } from "./ProfileItem.types";

const selectNotificationsForProfile = createSelector(
  [
    (state: RootState) => state.profilesCache.profiles,
    (_: RootState, profileId: string) => profileId,
  ],
  (profiles, profileId): KeriaNotification[] =>
    profiles[profileId]?.notifications || []
);

const ProfileItem = ({ identifier, onClick }: ProfileItemsProps) => {
  const notifications = useAppSelector((state) =>
    selectNotificationsForProfile(state, identifier?.id || "")
  );

  const notificationsCounter = notifications.filter(
    (notification) =>
      !notification.read && notification.a.r !== NotificationRoute.MultiSigIcp
  ).length;

  if (!identifier) return null;
  const { id, displayName, creationStatus, groupMetadata, groupMemberPre } =
    identifier;
  const hasJoinGroupNoti = notifications.some(
    (item) => item.a.r === NotificationRoute.MultiSigIcp
  );

  const isGroupMember = !!groupMetadata || !!groupMemberPre;
  const identifierCreated =
    !!groupMemberPre && creationStatus === CreationStatus.COMPLETE;

  const actionRequired =
    isGroupMember &&
    !identifierCreated &&
    ((groupMetadata?.groupInitiator &&
      creationStatus === CreationStatus.COMPLETE) ||
      (!groupMetadata?.groupInitiator && hasJoinGroupNoti));

  const isInitiatorPending =
    groupMetadata?.groupInitiator && creationStatus === CreationStatus.PENDING;
  const isMemberPending = !groupMetadata?.groupInitiator && !hasJoinGroupNoti;

  const pending =
    isGroupMember &&
    !identifierCreated &&
    (isInitiatorPending || isMemberPending);

  return (
    <div
      className="profiles-list-item"
      onClick={onClick}
      data-testid={`profiles-list-item-${id}`}
    >
      <div className="profiles-list-item-avatar">
        <Avatar
          id={
            displayName === "Mary"
              ? "100"
              : displayName === "Oliver"
              ? "101"
              : id
          }
        />
      </div>
      <span className="profiles-list-item-inner">
        <div className="profiles-list-item-name">{displayName}</div>
        {pending && (
          <IonChip data-testid={`profiles-list-item-pending-${id}-status`}>
            <IonIcon
              icon={hourglassOutline}
              color="primary"
            />
            <span>{CreationStatus.PENDING.toLowerCase()}</span>
          </IonChip>
        )}
        {actionRequired && (
          <IonChip
            className="action-needed"
            data-testid={`profiles-list-item-action-${id}-status`}
          >
            <IonIcon icon={warningOutline} />
            <span>{i18n.t("profiles.actionrequired")}</span>
          </IonChip>
        )}
        <BubbleCounter counter={notificationsCounter} />
      </span>
    </div>
  );
};

export { ProfileItem };
