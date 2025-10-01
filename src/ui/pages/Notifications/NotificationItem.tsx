import { IonIcon, IonItem, IonLabel } from "@ionic/react";
import { t } from "i18next";
import {
  documentOutline,
  ellipsisHorizontal,
  fingerPrintOutline,
  idCardOutline,
  personCircleOutline,
} from "ionicons/icons";
import { MouseEvent, useCallback, useState, useEffect } from "react";
import { Trans } from "react-i18next";
import { Agent } from "../../../core/agent/agent";
import {
  MultisigConnectionDetails,
  RegularConnectionDetails,
} from "../../../core/agent/agent.types";
import {
  KeriaNotification,
  NotificationRoute,
} from "../../../core/agent/services/keriaNotificationService.types";
import { useAppSelector } from "../../../store/hooks";
import {
  getConnectionsCache,
  getMultisigConnectionsCache,
} from "../../../store/reducers/profileCache";
import { FallbackIcon } from "../../components/FallbackIcon";
import { timeDifference } from "../../utils/formatters";
import { NotificationItemProps } from "./Notification.types";
import CitizenPortal from "../../assets/images/citizen-portal.svg";
import Socialbook from "../../assets/images/socialbook.svg";

const NotificationItem = ({
  item,
  onClick,
  onOptionButtonClick,
}: NotificationItemProps) => {
  const connectionsCache = useAppSelector(getConnectionsCache);
  const multisigConnectionsCache = useAppSelector(
    getMultisigConnectionsCache
  ) as MultisigConnectionDetails[];

  const connection = connectionsCache?.find((c) => c.id === item.connectionId);

  const unknownConnection = t("tabs.connections.unknown") ?? "Unknown";

  const initialConnectionName = connection?.label || unknownConnection;

  // Used for the one way scanning in the login process where we dont create a contact
  const [connectionName, setConnectionName] = useState<string>(
    initialConnectionName
  );

  const check = useCallback(async () => {
    const connection = await Agent.agent.connections.getConnectionById(
      item.connectionId
    );

    if (connection?.serviceEndpoints[0]) {
      try {
        const url = new URL(connection.serviceEndpoints[0]);
        const typeParam = url.searchParams.get("type");
        const type = typeParam;
        if (type === "guardianship") {
          setConnectionName("Citizen Portal");
        } else if (type === "socialmedia") {
          setConnectionName("Socialbook");
        } else {
          setConnectionName(connection.label || "Unknown");
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error parsing URL:", error);
        setConnectionName(connection.label || "Unknown");
      }
    }
  }, [item.connectionId]);

  useEffect(() => {
    if (connectionName === "Unknown") {
      check();
    }
  }, [connectionName, check]);

  const notificationLabelText = (() => {
    switch (item.a.r) {
      case NotificationRoute.ExnIpexGrant:
        return t("tabs.notifications.tab.labels.exnipexgrant", {
          connection: connectionName,
        });
      case NotificationRoute.MultiSigIcp:
        return t("tabs.notifications.tab.labels.multisigicp", {
          connection:
            multisigConnectionsCache?.find((c) => c.id === item.connectionId)
              ?.label || unknownConnection,
        });
      case NotificationRoute.ExnIpexApply: {
        if (
          item.groupReplied &&
          !item.groupInitiator &&
          item.groupInitiatorPre
        ) {
          const initiator = item.groupInitiatorPre
            ? multisigConnectionsCache.find(
                (c) => c.id === item.groupInitiatorPre
              )?.label || unknownConnection
            : unknownConnection;
          return t("tabs.notifications.tab.labels.exnipexapplyproposed", {
            connection: connectionName,
            initiator,
          });
        }

        return t("tabs.notifications.tab.labels.exnipexapply", {
          connection: connectionName,
        });
      }
      case NotificationRoute.LocalAcdcRevoked:
        return t("tabs.notifications.tab.labels.exnipexgrantrevoke", {
          credential: item.a.credentialTitle,
        });
      case NotificationRoute.MultiSigExn:
        return t("tabs.notifications.tab.labels.multisigexn", {
          connection: connectionName,
        });
      case NotificationRoute.RemoteSignReq:
        return t("tabs.notifications.tab.labels.sign", {
          connection: connectionName,
        });
      case NotificationRoute.ExnCoordinationCredentialsInfoReq:
        return t("tabs.notifications.tab.labels.share", {
          connection: connectionName,
        });
      case NotificationRoute.ExnCoordinationCredentialsIssueProp:
        return t("tabs.notifications.tab.labels.issuecredential", {
          connection: connectionName,
        });
      case NotificationRoute.HumanReadableMessage:
        return item.a.m as string;
      case NotificationRoute.LocalSingletonConnectInstructions:
        return t("tabs.notifications.tab.labels.connectinstructions", {
          connection: item.a.name || unknownConnection,
        });
      default:
        return "";
    }
  })();

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

  const logo = (() => {
    if (connectionName === "Citizen Portal") {
      return (
        <div className="citizen-portal-logo-container">
          <img
            src={CitizenPortal}
            alt={connectionName}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    if (connectionName === "Socialbook") {
      return (
        <div className="socialbook-logo-container">
          <img
            src={Socialbook}
            alt={connectionName}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    return (
      <FallbackIcon
        alt="notifications-tab-item-logo"
        className="notifications-tab-item-logo"
        data-testid="notifications-tab-item-logo"
      />
    );
  })();

  return (
    <IonItem
      onClick={() => onClick(item)}
      className={`notifications-tab-item${item.read ? "" : " unread"}`}
      data-testid={`notifications-tab-item-${item.id}`}
    >
      <div className="notification-logo">
        {logo}
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
