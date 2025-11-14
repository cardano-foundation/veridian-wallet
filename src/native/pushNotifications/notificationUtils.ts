import { t } from "i18next";
import {
  KeriaNotification,
  NotificationRoute,
} from "../../core/agent/services/keriaNotificationService.types";
import {
  MultisigConnectionDetails,
  RegularConnectionDetails,
} from "../../core/agent/agent.types";

export interface NotificationContext {
  connectionsCache: RegularConnectionDetails[];
  multisigConnectionsCache: MultisigConnectionDetails[];
}

const stripHtmlTags = (text: string): string => {
  return text.replace(/<[^>]*>/g, "");
};

export const getNotificationDisplayText = (
  item: KeriaNotification,
  context: NotificationContext
): string => {
  const { connectionsCache, multisigConnectionsCache } = context;

  const connection = connectionsCache.find((c) => c.id === item.connectionId);
  const connectionName = connection?.label;

  switch (item.a.r) {
    case NotificationRoute.ExnIpexGrant:
      return t("tabs.notifications.tab.labels.exnipexgrant", {
        connection: connectionName || t("tabs.connections.unknown"),
      });
    case NotificationRoute.MultiSigIcp:
      return t("tabs.notifications.tab.labels.multisigicp", {
        connection:
          multisigConnectionsCache.find((c) => c.id === item.connectionId)
            ?.label || t("tabs.connections.unknown"),
      });
    case NotificationRoute.ExnIpexApply: {
      if (item.groupReplied && !item.groupInitiator && item.groupInitiatorPre) {
        const initiator = item.groupInitiatorPre
          ? multisigConnectionsCache.find(
              (c) => c.id === item.groupInitiatorPre
            )?.label || t("tabs.connections.unknown")
          : t("tabs.connections.unknown");
        return t("tabs.notifications.tab.labels.exnipexapplyproposed", {
          connection: connectionName || t("tabs.connections.unknown"),
          initiator,
        });
      }

      return t("tabs.notifications.tab.labels.exnipexapply", {
        connection: connectionName || t("tabs.connections.unknown"),
      });
    }
    case NotificationRoute.LocalAcdcRevoked:
      return t("tabs.notifications.tab.labels.exnipexgrantrevoke", {
        credential: item.a.credentialTitle || "",
      });
    case NotificationRoute.RemoteSignReq:
      return t("tabs.notifications.tab.labels.sign", {
        connection: connectionName || t("tabs.connections.unknown"),
      });
    case NotificationRoute.HumanReadableMessage:
      return typeof item.a.m === "string" ? item.a.m : "";
    case NotificationRoute.LocalSingletonConnectInstructions:
      return t("tabs.notifications.tab.labels.connectinstructions", {
        connection: item.a.name || t("tabs.connections.unknown"),
      });
    default:
      return t("tabs.notifications.tab.labels.fallback");
  }
};

export const getNotificationDisplayTextForPush = (
  item: KeriaNotification,
  context: NotificationContext
): string => {
  const htmlText = getNotificationDisplayText(item, context);
  return stripHtmlTags(htmlText);
};
