import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { TabsRoutePath } from "../../routes/paths";
import {
  NotificationPayload,
  LocalNotification,
} from "./notificationService.types";

const PRIMARY_COLOR =
  getComputedStyle(document.documentElement)
    .getPropertyValue("--ion-color-primary-700")
    .trim() || "#0056b3";

class NotificationService {
  private profileSwitcher: ((profileId: string) => void) | null = null;
  private navigator: ((path: string, notificationId?: string) => void) | null =
    null;
  private permissionsGranted = false;
  private pendingNotification: LocalNotification | null = null;

  constructor() {
    this.initialize();
  }

  setProfileSwitcher(profileSwitcher: (profileId: string) => void) {
    this.profileSwitcher = profileSwitcher;
    this.processPendingNotification();
  }

  setNavigator(navigator: (path: string, notificationId?: string) => void) {
    this.navigator = navigator;
    this.processPendingNotification();
  }

  private async processPendingNotification() {
    if (this.pendingNotification && this.profileSwitcher && this.navigator) {
      const notification = this.pendingNotification;
      this.pendingNotification = null;
      await this.handleNotificationTap(notification);
    }
  }

  private async initialize() {
    LocalNotifications.removeAllListeners();

    this.permissionsGranted = await this.requestPermissions();
    await this.createNotificationChannel();

    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        this.handleNotificationTap(event.notification as LocalNotification);
      }
    );
  }

  private async createNotificationChannel(): Promise<void> {
    const platform = Capacitor.getPlatform();
    if (platform !== "android") {
      return;
    }

    await LocalNotifications.createChannel({
      id: "veridian-notifications",
      name: "Veridian Notifications",
      description: "Notifications for credential and connection updates",
      sound: "default",
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: PRIMARY_COLOR,
      vibration: true,
    });
  }

  async requestPermissions(): Promise<boolean> {
    const result = await LocalNotifications.requestPermissions();
    this.permissionsGranted = result.display === "granted";
    return this.permissionsGranted;
  }

  async schedulePushNotification(payload: NotificationPayload): Promise<void> {
    if (!this.permissionsGranted) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error("Notification permissions not granted");
      }
    }

    let hash = 0;
    for (let i = 0; i < payload.notificationId.length; i++) {
      const char = payload.notificationId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const notificationId = Math.abs(hash);

    const launchUrl = `veridian://notification?profileId=${payload.profileId}&notificationId=${payload.notificationId}`;

    const notificationConfig = {
      notifications: [
        {
          id: notificationId,
          title: payload.title,
          body: payload.body,
          actionTypeId: "default",
          extra: {
            profileId: payload.profileId,
            notificationId: payload.notificationId,
            launchUrl,
          },
          largeIcon: "res://drawable/notification_icon",
          smallIcon: "res://drawable/notification_small",
          iconColor: PRIMARY_COLOR,
          channelId: "veridian-notifications",
        },
      ],
    };

    await LocalNotifications.schedule(notificationConfig);
  }

  private async handleNotificationTap(
    notification: LocalNotification
  ): Promise<void> {
    const { profileId, notificationId } = notification.extra;

    if (!profileId || !this.profileSwitcher || !this.navigator) {
      this.pendingNotification = notification;
      return;
    }

    this.profileSwitcher(profileId as string);
    await this.clearDeliveredNotificationsForProfile(profileId as string);
    this.navigator(TabsRoutePath.NOTIFICATIONS, notificationId as string);
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await LocalNotifications.cancel({
      notifications: [{ id: parseInt(notificationId) }],
    });
  }

  async clearDeliveredNotificationsForProfile(
    profileId: string
  ): Promise<void> {
    const delivered = await LocalNotifications.getDeliveredNotifications();
    const toCancel = delivered.notifications
      .filter((n) => n.extra?.profileId === profileId)
      .map((n) => ({ id: n.id }));

    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }
  }

  async getActiveNotifications(): Promise<LocalNotification[]> {
    const result = await LocalNotifications.getPending();
    return result.notifications as LocalNotification[];
  }

  async getDeliveredNotifications(): Promise<LocalNotification[]> {
    const result = await LocalNotifications.getDeliveredNotifications();
    return result.notifications as LocalNotification[];
  }

  async arePermissionsGranted(): Promise<boolean> {
    const result = await LocalNotifications.checkPermissions();
    const granted = result.display === "granted";
    this.permissionsGranted = granted;
    return granted;
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
