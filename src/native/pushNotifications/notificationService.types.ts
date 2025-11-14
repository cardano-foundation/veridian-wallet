interface NotificationPayload {
  notificationId: string;
  profileId: string;
  title: string;
  body: string;
}

interface LocalNotification {
  id: number;
  extra: {
    profileId: string;
    [key: string]: unknown;
  };
}

export type { NotificationPayload, LocalNotification };
