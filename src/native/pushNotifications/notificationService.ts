import {
  LocalNotifications,
  LocalNotificationSchema,
} from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { TabsRoutePath } from "../../routes/paths";
import { NotificationPayload } from "./notificationService.types";
import { showError } from "../../ui/utils/error";

const PRIMARY_COLOR =
  getComputedStyle(document.documentElement)
    .getPropertyValue("--ion-color-primary-700")
    .trim() || "#0056b3";
const PUSH_NOTIFICATIONS_ANDROID_CHANNEL_ID = "veridian-notifications";
const PUSH_NOTIFICATION_EVENT_LISTENER_TYPE = "notificationNavigation";
const NOTIFICATION_DEFAULTS = {
  largeIcon: "res://drawable/notification_icon",
  smallIcon: "res://drawable/notification_small",
  iconColor: PRIMARY_COLOR,
  channelId: PUSH_NOTIFICATIONS_ANDROID_CHANNEL_ID,
} as const;

const CHANNEL_CONFIG = {
  id: PUSH_NOTIFICATIONS_ANDROID_CHANNEL_ID,
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
  private pendingNotification: LocalNotificationSchema | null = null;
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
        this.handleNotificationTap(event.notification);
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
      new CustomEvent(PUSH_NOTIFICATION_EVENT_LISTENER_TYPE, {
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
    notification: LocalNotificationSchema
  ): Promise<void> {
    if (!notification.extra || typeof notification.extra.profile !== "string") {
      // Keeping this for debugging purposes
      showError("Notification missing extra data:", notification);
      return;
    }

    const { profileId } = notification.extra;

    if (!this.profileSwitcher) {
      this.pendingNotification = notification;
      return;
    }

    this.profileSwitcher(profileId as string);
    this.navigateToPath(TabsRoutePath.NOTIFICATIONS);
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
export { NotificationService, PUSH_NOTIFICATION_EVENT_LISTENER_TYPE };
