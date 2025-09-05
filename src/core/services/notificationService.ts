import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { TabsRoutePath } from "../../routes/paths";
import { showError } from "../../ui/utils/error";

export const NOTIFICATION_MESSAGES = {
  NEW_CREDENTIAL: "New credential received", //r: '/exn/ipex/grant'
  CREDENTIAL_PRESENTATION_REQUEST:
    "A credential presentation is being requested", //r: '/exn/ipex/apply'
  NEW_CONNECTION: "You have a new connection", //r: '/exn/ipex/connect'
  GROUP_INITIATED: "Your group has been initiated", //r: '/exn/ipex/group'
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
    // Request permissions on app start
    await this.requestPermissions();

    // Listen for notification actions (taps) - works on both platforms
    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        this.handleNotificationTap(event.notification);
      }
    );

    // Listen for app coming to foreground
    App.addListener("appStateChange", (state) => {
      if (state.isActive) {
        this.clearDeliveredNotifications();
        // Check if app was launched from notification
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
      // If we can't determine app state, assume it's in foreground to be safe
      return true;
    }
  }

  async scheduleNotification(payload: NotificationPayload): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(payload.notificationId),
            title: payload.title,
            body: payload.body,
            actionTypeId: "default", // Add default action for iOS tap handling
            extra: {
              profileId: payload.profileId,
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
    // Only show notifications when app is in foreground
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
    // Map KERIA notification types to local notification format
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
    // Use profile displayName (profiles always have a displayName)
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
    return "You have a new notification"; // fallback
  }

  private handleNotificationTap(notification: LocalNotification): void {
    // Process immediately using hash navigation - no need to wait for React Router
    this.processNotificationTap(notification);
  }

  private processNotificationTap(notification: LocalNotification): void {
    const extra = notification.extra || {};
    const profileId = extra.profileId;

    // Switch to the relevant profile if different from current
    if (profileId && this.profileSwitcher) {
      this.profileSwitcher(profileId);
    }

    // Longer delay to allow profile switch to take effect before navigation
    setTimeout(() => {
      // Use the navigator callback if available, otherwise fallback to hash navigation
      if (this.navigator) {
        try {
          this.navigator(TabsRoutePath.NOTIFICATIONS);
        } catch (error) {
          showError("Failed to navigate via navigator", error);
          // Fallback to hash navigation
          window.location.hash = TabsRoutePath.NOTIFICATIONS;
        }
      } else {
        // Fallback to hash navigation
        window.location.hash = TabsRoutePath.NOTIFICATIONS;
      }
    }, 500); // Increased delay to allow profile switch and router to be ready
  }

  private async checkAppLaunchFromNotification(): Promise<void> {
    try {
      // Check if app was launched from a notification
      const launchUrl = await App.getLaunchUrl();
      if (launchUrl && launchUrl.url) {
        // App was launched from notification - navigation will be handled by the router
      }
    } catch (error) {
      // Failed to check app launch - silently ignore
    }
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

// Export singleton instance
export const notificationService = new NotificationService();

// Export class for testing
export { NotificationService };
