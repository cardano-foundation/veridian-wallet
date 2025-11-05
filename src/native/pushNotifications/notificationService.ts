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

const NOTIFICATION_DEFAULTS = {
  largeIcon: "res://drawable/notification_icon",
  smallIcon: "res://drawable/notification_small",
  iconColor: PRIMARY_COLOR,
  channelId: "veridian-notifications",
} as const;

const CHANNEL_CONFIG = {
  id: "veridian-notifications",
  name: "Veridian Notifications",
  description: "Notifications for credential and connection updates",
  sound: "default" as const,
  importance: 5 as const,
  visibility: 1 as const,
  lights: true,
  lightColor: PRIMARY_COLOR,
  vibration: true,
};

class NotificationService {
  private profileSwitcher: ((profileId: string) => void) | null = null;
  private permissionsGranted = false;
  private pendingNotification: LocalNotification | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.isNativeEnvironment()) {
      return;
    }

    LocalNotifications.removeAllListeners();

    const result = await LocalNotifications.requestPermissions();
    this.permissionsGranted = result.display === "granted";
    await this.createNotificationChannel();

    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        this.handleNotificationTap(event.notification as LocalNotification);
      }
    );

    this.initialized = true;
  }

  private isNativeEnvironment(): boolean {
    try {
      const platform = Capacitor.getPlatform();
      return platform === "ios" || platform === "android";
    } catch {
      return false;
    }
  }

  setProfileSwitcher(profileSwitcher: (profileId: string) => void) {
    this.profileSwitcher = profileSwitcher;
    this.processPendingNotification();
  }

  private navigateToPath(path: string): void {
    window.history.pushState(null, "", path);
    window.dispatchEvent(
      new CustomEvent("notificationNavigation", {
        detail: { path },
      })
    );
  }

  private async processPendingNotification() {
    if (this.pendingNotification && this.profileSwitcher) {
      await this.handleNotificationTap(this.pendingNotification);
      this.pendingNotification = null;
    }
  }

  private async createNotificationChannel(): Promise<void> {
    const platform = Capacitor.getPlatform();
    if (platform !== "android") {
      return;
    }

    await LocalNotifications.createChannel(CHANNEL_CONFIG);
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
          ...NOTIFICATION_DEFAULTS,
        },
      ],
    };

    await LocalNotifications.schedule(notificationConfig);
  }

  private async handleNotificationTap(
    notification: LocalNotification
  ): Promise<void> {
    const { profileId } = notification.extra;

    if (!this.profileSwitcher) {
      this.pendingNotification = notification;
      return;
    }

    this.profileSwitcher(profileId as string);
    await this.clearDeliveredNotificationsForProfile(profileId as string);
    this.navigateToPath(TabsRoutePath.NOTIFICATIONS);
  }

  async clearDeliveredNotificationsForProfile(
    profileId: string
  ): Promise<void> {
    const delivered = await this.getDeliveredNotifications();
    const toCancel = delivered
      .filter((n) => n.extra.profileId === profileId)
      .map((n) => ({ id: n.id }));

    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }
  }

  async getDeliveredNotifications(): Promise<LocalNotification[]> {
    const result = await LocalNotifications.getDeliveredNotifications();
    return result.notifications as LocalNotification[];
  }

  // TODO: Implement permissions
  async arePermissionsGranted(): Promise<boolean> {
    const result = await LocalNotifications.checkPermissions();
    const granted = result.display === "granted";
    this.permissionsGranted = granted;
    return granted;
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
