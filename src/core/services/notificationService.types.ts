enum ColdStartState {
  IDLE = "IDLE",
  PROCESSING = "PROCESSING",
  READY = "READY",
}

interface NotificationPayload {
  notificationId: string;
  profileId: string;
  title: string;
  body: string;
  timestamp: number;
}

interface LocalNotification {
  id: number;
  extra: {
    profileId: string;
    [key: string]: unknown;
  };
}

export { ColdStartState };

export type { NotificationPayload, LocalNotification };
