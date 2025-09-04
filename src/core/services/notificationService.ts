import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { useHistory } from "react-router-dom";
import { useEffect } from "react";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
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
    [key: string]: any;
  };
}

class NotificationService {
  private history: ReturnType<typeof useHistory> | null = null;

  constructor() {
    this.initialize();
  }

  setHistory(history: ReturnType<typeof useHistory>) {
    this.history = history;
  }

  private async initialize() {
    // Request permissions on app start
    await this.requestPermissions();

    // Listen for notification actions (taps)
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

  async scheduleNotification(payload: NotificationPayload): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(payload.notificationId),
            title: payload.title,
            body: payload.body,
            schedule: { at: new Date() }, // Immediate delivery
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
    keriaNotification: KeriaNotification
  ): Promise<void> {
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

  private getNotificationTitle(
    notification: KeriaNotification,
    type: string
  ): string {
    switch (type) {
      case "credential":
        return "New Credential Received";
      case "multisig":
        return "Multi-signature Request";
      case "connection":
        return "New Connection";
      default:
        return "Veridian Wallet";
    }
  }

  private getNotificationBody(
    notification: KeriaNotification,
    _type: string
  ): string {
    // Extract meaningful content from the notification
    const message = notification.a?.m;
    return typeof message === "string"
      ? message
      : "You have a new notification";
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
    if (!this.history) return;

    const extra = notification.extra || {};
    const route = extra.route || TabsRoutePath.NOTIFICATIONS;

    // Navigate to the appropriate section
    this.history.push(route);
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
