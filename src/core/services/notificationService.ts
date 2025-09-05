import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { Device } from "@capacitor/device";
import { useHistory } from "react-router-dom";
import { useEffect } from "react";
import {
  KeriaNotification,
  ExchangeRoute,
} from "../../core/agent/services/keriaNotificationService.types";
import { TabsRoutePath } from "../../routes/paths";
import { showError } from "../../ui/utils/error";

export interface NotificationPayload {
  notificationId: string;
  profileId: string;
  type: "credential" | "connection" | "multisig" | "general";
  title: string;
  body: string;
  route?: string;
}

interface LocalNotification {
  id: number;
  extra?: {
    route?: string;
    profileId?: string;
    [key: string]: unknown;
  };
}

class NotificationService {
  private history: ReturnType<typeof useHistory> | null = null;
  private profileSwitcher: ((profileId: string) => void) | null = null;
  private pendingNotificationTaps: LocalNotification[] = [];

  constructor() {
    this.initialize();
  }

  setHistory(history: ReturnType<typeof useHistory>) {
    this.history = history;
    // Process any pending notification taps now that we have history
    this.processPendingNotificationTaps();
  }

  setProfileSwitcher(profileSwitcher: (profileId: string) => void) {
    this.profileSwitcher = profileSwitcher;
  }

  private async initialize() {
    // Request permissions on app start
    await this.requestPermissions();

    // Get device info to determine platform
    const deviceInfo = await Device.getInfo();
    const isIOS = deviceInfo.platform === "ios";

    // Listen for notification actions (taps) - works on both platforms
    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        this.handleNotificationTap(event.notification);
      }
    );

    // On iOS, also listen for notification received as fallback
    if (isIOS) {
      LocalNotifications.addListener("localNotificationReceived", (event) => {
        // On iOS, sometimes tapping a notification triggers this event
        // Try to handle it as a tap if we have the notification data
        if (event && event.extra) {
          this.handleNotificationTap(event as LocalNotification);
        }
      });
    }

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

  private async registerNotificationActions(): Promise<void> {
    try {
      // Only register actions on iOS
      const deviceInfo = await Device.getInfo();
      if (deviceInfo.platform === "ios") {
        await LocalNotifications.registerActionTypes({
          types: [
            {
              id: "default",
              actions: [
                {
                  id: "tap",
                  title: "Open",
                  foreground: true,
                },
              ],
            },
          ],
        });
      }
    } catch (error) {
      // Failed to register notification actions - silently ignore
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
            // Remove schedule for immediate delivery
            actionTypeId: "default", // Add default action for iOS tap handling
            extra: {
              profileId: payload.profileId,
              type: payload.type,
              route: payload.route,
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
    _currentProfileId?: string
  ): Promise<void> {
    // Only show notifications when app is in foreground
    const isAppActive = await this.isAppInForeground();
    if (!isAppActive) {
      return;
    }

    const payload = this.mapKeriaNotificationToPayload(keriaNotification);

    if (payload) {
      await this.scheduleNotification(payload);
    }
  }

  private mapKeriaNotificationToPayload(
    notification: KeriaNotification
  ): NotificationPayload | null {
    // Map KERIA notification types to local notification format
    const type = this.getNotificationType(notification);
    const title = this.getNotificationTitle(notification, type);
    const body = this.getNotificationBody(notification, type);
    const route = this.getNotificationRoute(notification, type);

    return {
      notificationId: notification.id,
      profileId: notification.receivingPre,
      type,
      title,
      body,
      route,
    };
  }

  private getNotificationType(
    notification: KeriaNotification
  ): NotificationPayload["type"] {
    // Map based on notification route or content
    const route = notification.a?.r;
    if (typeof route === "string") {
      if (route.includes("credential")) return "credential";
      if (route.includes("multisig")) return "multisig";
    }
    if (notification.connectionId) return "connection";
    return "general";
  }

  private getNotificationMessage(route: string, prefix: string): string {
    switch (route) {
      case ExchangeRoute.IpexAdmit:
        return `${prefix} IpexAdmit`;
      case ExchangeRoute.IpexGrant:
        return `${prefix} IpexGrant`;
      case ExchangeRoute.IpexApply:
        return `${prefix} IpexApply`;
      case ExchangeRoute.IpexAgree:
        return `${prefix} IpexAgree`;
      case ExchangeRoute.IpexOffer:
        return `${prefix} IpexOffer`;
      case ExchangeRoute.RemoteSignRef:
        return `${prefix} RemoteSignRef`;
      default:
        // Check for other notification routes
        if (route.includes("/multisig")) {
          return prefix === "Title for"
            ? "Multi-signature Request"
            : `${prefix} Multi-signature operation`;
        }
        if (route.includes("/exn/ipex") || route.includes("/credential")) {
          return prefix === "Title for"
            ? "New Credential Message"
            : `${prefix} Credential exchange`;
        }
        return prefix === "Title for"
          ? "New Connection"
          : `${prefix} notification`;
    }
  }

  private getNotificationTitle(
    _notification: KeriaNotification,
    _type: string
  ): string {
    return "Cardano Foundation";
  }

  private getNotificationBody(
    notification: KeriaNotification,
    _type: string
  ): string {
    // First, check if notification.a.m exists and is not empty
    const message = notification.a?.m;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    // If no message, use pre-defined message based on ExchangeRoute
    const route = notification.a?.r;
    if (typeof route === "string") {
      return this.getNotificationMessage(route, "Body for");
    }

    return "You have a new notification";
  }

  private getNotificationRoute(
    notification: KeriaNotification,
    type: string
  ): string {
    switch (type) {
      case "credential":
        return TabsRoutePath.CREDENTIALS;
      case "multisig":
        return TabsRoutePath.CREDENTIALS; // Could be specific multisig route
      case "connection":
        return TabsRoutePath.CONNECTIONS;
      default:
        return TabsRoutePath.NOTIFICATIONS;
    }
  }

  private handleNotificationTap(notification: LocalNotification): void {
    // Try to process immediately if history is available
    if (this.history) {
      this.processNotificationTap(notification);
      return;
    }

    // If history is not available, queue and try again with increasing delays
    this.pendingNotificationTaps.push(notification);

    // Try multiple times with increasing delays
    const tryProcess = (attempt: number) => {
      if (this.history && this.pendingNotificationTaps.length > 0) {
        this.processPendingNotificationTaps();
      } else if (attempt < 5) {
        // Try up to 5 times
        setTimeout(() => tryProcess(attempt + 1), attempt * 500); // 0.5s, 1s, 1.5s, 2s, 2.5s
      } else {
        // Clear the queue if we can't process after multiple attempts
        this.pendingNotificationTaps = [];
      }
    };

    setTimeout(() => tryProcess(1), 500);
  }

  private processNotificationTap(notification: LocalNotification): void {
    const extra = notification.extra || {};
    const profileId = extra.profileId;

    // Switch to the relevant profile if different from current
    if (profileId && this.profileSwitcher) {
      this.profileSwitcher(profileId);
    }

    // Navigate to the notifications tab using hash navigation
    // This works with Ionic's router system
    window.location.hash = TabsRoutePath.NOTIFICATIONS;
  }

  private async checkAppLaunchFromNotification(): Promise<void> {
    try {
      // Check if app was launched from a notification
      const launchUrl = await App.getLaunchUrl();
      if (launchUrl && launchUrl.url) {
        // If launched from URL, it might be from a notification
        // For now, just process any pending taps
        if (this.pendingNotificationTaps.length > 0) {
          this.processPendingNotificationTaps();
        }
      }
    } catch (error) {
      // Failed to check app launch - silently ignore
    }
  }

  private processPendingNotificationTaps(): void {
    if (!this.history) return;

    while (this.pendingNotificationTaps.length > 0) {
      const notification = this.pendingNotificationTaps.shift();
      if (notification) {
        this.processNotificationTap(notification);
      }
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

// React hook for components to use the notification service
export const useNotificationService = () => {
  const history = useHistory();

  useEffect(() => {
    notificationService.setHistory(history);
  }, [history]);

  return notificationService;
};
