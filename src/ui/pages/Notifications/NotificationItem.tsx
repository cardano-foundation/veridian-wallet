import {
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
} from "@ionic/react";
import {
  documentOutline,
  fingerPrintOutline,
  idCardOutline,
  mailOpenOutline,
  mailUnreadOutline,
  trashOutline,
} from "ionicons/icons";
import { useState } from "react";
import { Trans } from "react-i18next";
import {
  KeriaNotification,
  NotificationRoute,
} from "../../../core/agent/services/keriaNotificationService.types";
import { getNotificationDisplayText } from "../../../native/pushNotifications/notificationUtils";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getConnectionsCache,
  getMultisigConnectionsCache,
  deleteNotificationById,
  markNotificationAsRead,
} from "../../../store/reducers/profileCache";
import { FallbackIcon } from "../../components/FallbackIcon";
import { timeDifference } from "../../utils/formatters";
import { NotificationItemProps } from "./Notification.types";
import { i18n } from "../../../i18n";
import { Agent } from "../../../core/agent/agent";
import { showError } from "../../utils/error";
import { Alert } from "../../components/Alert";

const NotificationItem = ({ item, onClick }: NotificationItemProps) => {
  const dispatch = useAppDispatch();
  const connectionsCache = useAppSelector(getConnectionsCache);
  const multisigConnectionsCache = useAppSelector(getMultisigConnectionsCache);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
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
      default:
        return idCardOutline;
    }
  };

  const toggleReadStatus = async () => {
    try {
      if (item.read) {
        await Agent.agent.keriaNotifications.unreadNotification(item.id);
      } else {
        await Agent.agent.keriaNotifications.readNotification(item.id);
      }

      dispatch(
        markNotificationAsRead({
          id: item.id,
          read: !item.read,
        })
      );
    } catch (e) {
      showError("Unable to change notification status", e, dispatch);
    }
  };

  const deleteNotification = () => {
    setOpenDeleteAlert(true);
  };

  const confirmDeleteNotification = async () => {
    try {
      await Agent.agent.keriaNotifications.deleteNotificationRecordById(
        item.id,
        item.a.r as NotificationRoute
      );
      dispatch(deleteNotificationById(item.id));
      setOpenDeleteAlert(false);
    } catch (e) {
      showError("Unable to remove notification", e, dispatch);
    }
  };

  return (
    <>
      <IonItemSliding className="notification-tab-item-slide">
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
        </IonItem>
        <IonItemOptions
          side="end"
          onIonSwipe={deleteNotification}
        >
          <IonItemOption
            className="read-button"
            onClick={toggleReadStatus}
            data-testid={`toogle-read-button-${item.id}`}
          >
            <div className="option-content">
              <IonIcon icon={item.read ? mailUnreadOutline : mailOpenOutline} />
              <span>
                {item.read
                  ? i18n.t("tabs.notifications.tab.notificationitem.unread")
                  : i18n.t("tabs.notifications.tab.notificationitem.read")}
              </span>
            </div>
          </IonItemOption>
          <IonItemOption
            color="danger"
            onClick={deleteNotification}
            data-testid={`delete-button-${item.id}`}
            expandable
          >
            <div className="option-content">
              <IonIcon icon={trashOutline} />
              <span>
                {i18n.t("tabs.notifications.tab.notificationitem.delete")}
              </span>
            </div>
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
      <Alert
        isOpen={openDeleteAlert}
        setIsOpen={setOpenDeleteAlert}
        dataTestId={`alert-delete-notification-${item.id}`}
        headerText={i18n.t(
          "tabs.notifications.tab.notificationitem.deletealert.text"
        )}
        confirmButtonText={`${i18n.t(
          "tabs.notifications.tab.notificationitem.deletealert.accept"
        )}`}
        cancelButtonText={`${i18n.t(
          "tabs.notifications.tab.notificationitem.deletealert.cancel"
        )}`}
        actionCancel={() => setOpenDeleteAlert(false)}
        actionConfirm={confirmDeleteNotification}
        actionDismiss={() => setOpenDeleteAlert(false)}
      />
    </>
  );
};

export { NotificationItem };
