import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { TabsRoutePath } from "../../routes/paths";
import { showError } from "../../ui/utils/error";

export const NOTIFICATION_MESSAGES = {
  NEW_CREDENTIAL: "New credential received",
  CREDENTIAL_PRESENTATION_REQUEST:
    "A credential presentation is being requested",
  NEW_CONNECTION: "You have a new connection",
  GROUP_INITIATED: "Your group has been initiated",
  FALLBACK: "You have a new notification",
} as const;

export interface NotificationPayload {
  notificationId: string;
  profileId: string;
  title: string;
  body: string;
}

interface LocalNotification {
  id: number;
  extra?: {
    profileId?: string;
    [key: string]: unknown;
  };
}

class NotificationService {
  private profileSwitcher: ((profileId: string) => void) | null = null;
  private navigator: ((path: string) => void) | null = null;

  constructor() {
    this.initialize();
  }

  setProfileSwitcher(profileSwitcher: (profileId: string) => void) {
    this.profileSwitcher = profileSwitcher;
  }

  setNavigator(navigator: (path: string) => void) {
    this.navigator = navigator;
  }

  private async initialize() {
    await this.requestPermissions();

    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        this.handleNotificationTap(event.notification);
      }
    );

    App.addListener("appStateChange", (state) => {
      if (state.isActive) {
        this.clearDeliveredNotifications();
        this.checkAppLaunchFromNotification();
      }
    });
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    } catch (error) {
      showError("Failed to request notification permissions", error);
      return false;
    }
  }

  private async isAppInForeground(): Promise<boolean> {
    try {
      const state = await App.getState();
      return state.isActive;
    } catch (error) {
      return true;
    }
  }

  async scheduleNotification(payload: NotificationPayload): Promise<void> {
    try {
      const launchUrl = `veridian://notification?profileId=${payload.profileId}&notificationId=${payload.notificationId}`;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(payload.notificationId),
            title: payload.title,
            body: payload.body,
            actionTypeId: "default",
            extra: {
              profileId: payload.profileId,
              launchUrl: launchUrl,
            },
          },
        ],
      });
    } catch (error) {
      showError("Failed to schedule notification", error);
    }
  }

  async showLocalNotification(
    keriaNotification: KeriaNotification,
    _currentProfileId: string,
    profileDisplayName: string
  ): Promise<void> {
    const isAppActive = await this.isAppInForeground();
    if (!isAppActive) {
      return;
    }

    const payload = this.mapKeriaNotificationToPayload(
      keriaNotification,
      profileDisplayName
    );

    if (payload) {
      await this.scheduleNotification(payload);
    }
  }

  private mapKeriaNotificationToPayload(
    notification: KeriaNotification,
    profileDisplayName: string
  ): NotificationPayload | null {
    const title = this.getNotificationTitle(notification, profileDisplayName);
    const body = this.getNotificationBody(notification);

    return {
      notificationId: notification.id,
      profileId: notification.receivingPre,
      title,
      body,
    };
  }

  private getNotificationTitle(
    _notification: KeriaNotification,
    profileDisplayName: string
  ): string {
    return profileDisplayName;
  }

  private getNotificationBody(notification: KeriaNotification): string {
    const route = notification.a?.r;
    if (typeof route === "string") {
      if (route === "/exn/ipex/grant") {
        return NOTIFICATION_MESSAGES.NEW_CREDENTIAL;
      }
      if (route === "/exn/ipex/apply") {
        return NOTIFICATION_MESSAGES.CREDENTIAL_PRESENTATION_REQUEST;
      }
      if (route === "/exn/ipex/connect") {
        return NOTIFICATION_MESSAGES.NEW_CONNECTION;
      }
      if (route === "/exn/ipex/group") {
        return NOTIFICATION_MESSAGES.GROUP_INITIATED;
      }
    }
    return NOTIFICATION_MESSAGES.FALLBACK;
  }

  private handleNotificationTap(notification: LocalNotification): void {
    this.processNotificationTap(notification);
  }

  private processNotificationTap(notification: LocalNotification): void {
    const extra = notification.extra || {};
    const profileId = extra.profileId;
    const PROFILE_SWITCH_DELAY_MS = 500;

    if (profileId && this.profileSwitcher) {
      this.profileSwitcher(profileId);
    }

    setTimeout(() => {
      if (this.navigator) {
        try {
          this.navigator(TabsRoutePath.NOTIFICATIONS);
        } catch (error) {
          showError("Failed to navigate via navigator", error);
          window.location.hash = TabsRoutePath.NOTIFICATIONS;
        }
      } else {
        window.location.hash = TabsRoutePath.NOTIFICATIONS;
      }
    }, PROFILE_SWITCH_DELAY_MS);
  }

  private async checkAppLaunchFromNotification(): Promise<void> {
    try {
      const launchUrl = await App.getLaunchUrl();
      if (launchUrl && launchUrl.url) {
        const notificationData = this.parseNotificationUrl(launchUrl.url);
        if (notificationData) {
          await this.handleColdStartNotification(notificationData);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to check app launch URL:", error);
    }
  }

  private parseNotificationUrl(
    url: string
  ): { profileId: string; notificationId: string } | null {
    try {
      const urlObj = new URL(url);
      const profileId = urlObj.searchParams.get("profileId");
      const notificationId = urlObj.searchParams.get("notificationId");

      return profileId && notificationId ? { profileId, notificationId } : null;
    } catch (error) {
      return null;
    }
  }

  private async handleColdStartNotification(data: {
    profileId: string;
    notificationId: string;
  }): Promise<void> {
    await this.waitForAppInitialization();

    if (this.profileSwitcher) {
      this.profileSwitcher(data.profileId);
    }

    setTimeout(() => {
      if (this.navigator) {
        try {
          this.navigator(TabsRoutePath.NOTIFICATIONS);
        } catch (error) {
          showError("Failed to navigate via navigator", error);
          window.location.hash = TabsRoutePath.NOTIFICATIONS;
        }
      } else {
        window.location.hash = TabsRoutePath.NOTIFICATIONS;
      }
    }, 1000);
  }

  private async waitForAppInitialization(): Promise<void> {
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (this.profileSwitcher && this.navigator) {
          resolve();
        } else {
          setTimeout(checkInitialized, 100);
        }
      };
      checkInitialized();
    });
  }

  async clearDeliveredNotifications(): Promise<void> {
    try {
      await LocalNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      showError("Failed to clear delivered notifications", error);
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: parseInt(notificationId) }],
      });
    } catch (error) {
      showError("Failed to cancel notification", error);
    }
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
