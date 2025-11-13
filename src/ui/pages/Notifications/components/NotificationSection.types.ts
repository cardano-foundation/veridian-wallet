import { KeriaNotification } from "../../../../core/agent/services/keriaNotificationService.types";

interface NotificationSectionProps {
  title: string;
  data: KeriaNotification[];
  pageId: string;
  onNotificationClick: (item: KeriaNotification) => void;
  enableInfiniteScroll?: boolean;
  initialDisplayCount?: number;
  loadMoreCount?: number;
  testId?: string;
}

interface NotificationSectionRef {
  reset: () => void;
}

export type { NotificationSectionProps, NotificationSectionRef };
