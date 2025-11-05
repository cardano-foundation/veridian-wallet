import { IonIcon, IonItem, IonLabel } from "@ionic/react";
import {
  documentOutline,
  ellipsisHorizontal,
  fingerPrintOutline,
  idCardOutline,
  personCircleOutline,
} from "ionicons/icons";
import { MouseEvent } from "react";
import { Trans } from "react-i18next";
import {
  KeriaNotification,
  NotificationRoute,
} from "../../../core/agent/services/keriaNotificationService.types";
import { getNotificationDisplayText } from "../../../native/pushNotifications/notificationUtils";
import { useAppSelector } from "../../../store/hooks";
import {
  getConnectionsCache,
  getMultisigConnectionsCache,
} from "../../../store/reducers/profileCache";
import { FallbackIcon } from "../../components/FallbackIcon";
import { timeDifference } from "../../utils/formatters";
import { NotificationItemProps } from "./Notification.types";

const NotificationItem = ({
  item,
  onClick,
  onOptionButtonClick,
}: NotificationItemProps) => {
  const connectionsCache = useAppSelector(getConnectionsCache);
  const multisigConnectionsCache = useAppSelector(getMultisigConnectionsCache);
  const notificationLabelText = getNotificationDisplayText(item, {
    connectionsCache,
    multisigConnectionsCache,
  });

  const referIcon = (item: KeriaNotification) => {
    switch (item.a.r) {
      case NotificationRoute.ExnIpexGrant:
      case NotificationRoute.ExnIpexApply:
        return idCardOutline;
      case NotificationRoute.MultiSigIcp:
        return fingerPrintOutline;
      case NotificationRoute.RemoteSignReq:
        return documentOutline;
      case NotificationRoute.LocalSingletonConnectInstructions:
        return personCircleOutline;
      default:
        return idCardOutline;
    }
  };

  const openOptionModal = (e: MouseEvent) => {
    e.stopPropagation();

    onOptionButtonClick(item);
  };

  return (
    <IonItem
      onClick={() => onClick(item)}
      className={`notifications-tab-item${item.read ? "" : " unread"}`}
      data-testid={`notifications-tab-item-${item.id}`}
    >
      <div className="notification-logo">
        <FallbackIcon
          alt="notifications-tab-item-logo"
          className="notifications-tab-item-logo"
          data-testid="notifications-tab-item-logo"
        />
        <IonIcon
          src={referIcon(item)}
          size="small"
          className="notification-ref-icon"
        />
      </div>
      <IonLabel data-testid="notifications-tab-item-label">
        <Trans>{notificationLabelText}</Trans>
        <br />
        <span className="notifications-tab-item-time">
          {timeDifference(item.createdAt)[0]}
          {timeDifference(item.createdAt)[1]}
        </span>
      </IonLabel>
      <IonIcon
        aria-hidden="true"
        icon={ellipsisHorizontal}
        slot="end"
        className="notifications-tab-item-ellipsis"
        data-testid={`${item.id}-option-btn`}
        onClick={openOptionModal}
      />
    </IonItem>
  );
};

export { NotificationItem };
