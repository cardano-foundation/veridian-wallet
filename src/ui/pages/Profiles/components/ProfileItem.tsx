import { createSelector } from "@reduxjs/toolkit";
import { IonChip, IonIcon } from "@ionic/react";
import { hourglassOutline } from "ionicons/icons";
import { CreationStatus } from "../../../../core/agent/agent.types";
import { KeriaNotification } from "../../../../core/agent/services/keriaNotificationService.types";
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
    (notification) => !notification.read
  ).length;

  if (!identifier) return null;
  const { id, displayName, creationStatus } = identifier;

  return (
    <div
      className="profiles-list-item"
      onClick={onClick}
      data-testid={`profiles-list-item-${id}`}
    >
      <div className="profiles-list-item-avatar">
        <Avatar id={id} />
      </div>
      <span className="profiles-list-item-inner">
        <div className="profiles-list-item-name">{displayName}</div>
        {creationStatus === CreationStatus.PENDING && (
          <IonChip data-testid={`profiles-list-item-${id}-status`}>
            <IonIcon
              icon={hourglassOutline}
              color="primary"
            />
            <span>{CreationStatus.PENDING.toLowerCase()}</span>
          </IonChip>
        )}
        <BubbleCounter counter={notificationsCounter} />
      </span>
    </div>
  );
};

export { ProfileItem };
