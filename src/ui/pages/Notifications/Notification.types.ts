import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";

enum NotificationFilters {
  All = "all",
  Identifier = "identifiers",
  Credential = "credentials",
}

interface NotificationItemProps {
  item: KeriaNotification;
  onClick: (item: KeriaNotification) => void;
}

export { NotificationFilters };

export type { NotificationItemProps };
