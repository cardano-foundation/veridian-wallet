import { CredentialsFilters } from "../../pages/Credentials/Credentials.types";
import { NotificationFilters } from "../../pages/Notifications/Notification.types";

type AllowedChipFilter = NotificationFilters | CredentialsFilters;
interface FilterChipProps {
  filter: AllowedChipFilter;
  label: string;
  isActive: boolean;
  onClick: (filter: AllowedChipFilter) => void;
}

export type { AllowedChipFilter, FilterChipProps };
