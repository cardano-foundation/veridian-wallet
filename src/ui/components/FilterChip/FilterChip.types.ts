import { NotificationFilters } from "../../pages/Notifications/Notification.types";

type AllowedChipFilter = NotificationFilters;
interface FilterChipProps {
  filter: AllowedChipFilter;
  label: string;
  isActive: boolean;
  onClick: (filter: AllowedChipFilter) => void;
}

export type { AllowedChipFilter, FilterChipProps };
