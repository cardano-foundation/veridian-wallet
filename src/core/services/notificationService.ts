import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { TabsRoutePath } from "../../routes/paths";
import { showError } from "../../ui/utils/error";
import { Agent } from "../agent/agent";
import { MiscRecordId } from "../agent/agent.types";
import {
  NotificationContext,
  getNotificationDisplayTextForPush,
} from "./notificationUtils";

interface NotificationMetrics {
  totalScheduled: number;
  totalTapped: number;
  lastError?: string;
}

interface QueuedNotification {
  payload: NotificationPayload;
  timestamp: number;
}

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
  private metrics: NotificationMetrics = { totalScheduled: 0, totalTapped: 0 };
  private notificationQueue: QueuedNotification[] = [];
  private processingQueue = false;
  private permissionsGranted = false;
  private pendingColdStartNotification: {
    profileId: string;
    notificationId: string;
  } | null = null;
  private isColdStartProcessing = false;
  private targetProfileIdForColdStart: string | null = null;
  private readonly NAVIGATION_DELAY_MS = 500;
  private readonly COLD_START_DELAY_MS = 1000;
  private readonly DEBOUNCE_DELAY_MS = 100;
  private readonly QUEUE_PROCESS_INTERVAL_MS = 1000;

  constructor() {
    this.initialize();
    this.startQueueProcessor();
  }

  setProfileSwitcher(profileSwitcher: (profileId: string) => void) {
    this.profileSwitcher = profileSwitcher;
    this.processPendingColdStartNotification();
  }

  setNavigator(navigator: (path: string) => void) {
    this.navigator = navigator;
    this.processPendingColdStartNotification();
  }

  private async initialize() {
    this.permissionsGranted = await this.requestPermissions();

    await this.createNotificationChannel();

    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        this.handleNotificationTap(event.notification);
      }
    );
  }

  private async createNotificationChannel(): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id: "veridian-notifications",
        name: "Veridian Notifications",
        description: "Notifications for credential and connection updates",
        sound: "default",
        importance: 5,
        visibility: 1,
        lights: true,
        lightColor: "#4630EB",
        vibration: true,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to create notification channel:", error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      this.permissionsGranted = result.display === "granted";

      return this.permissionsGranted;
    } catch (error) {
      this.updateMetricsOnError("Failed to request permissions");
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
    if (!this.permissionsGranted) {
      this.updateMetricsOnError("Permissions not granted");
      return;
    }

    const queuedNotification: QueuedNotification = {
      payload,
      timestamp: Date.now(),
    };

    this.notificationQueue.push(queuedNotification);
  }

  async showLocalNotification(
    keriaNotification: KeriaNotification,
    _currentProfileId: string,
    profileDisplayName: string,
    context?: NotificationContext
  ): Promise<void> {
    const isAppActive = await this.isAppInForeground();
    if (!isAppActive) {
      return;
    }

    if (this.isColdStartProcessing) {
      return;
    }

    const alreadyShown = await this.isNotificationAlreadyShown(
      keriaNotification.id
    );

    if (alreadyShown) {
      return;
    }

    const payload = this.mapKeriaNotificationToPayload(
      keriaNotification,
      profileDisplayName,
      context
    );

    if (payload) {
      await this.scheduleNotification(payload);
      await this.markNotificationAsShown(keriaNotification.id);
    }
  }

  private mapKeriaNotificationToPayload(
    notification: KeriaNotification,
    profileDisplayName: string,
    context?: NotificationContext
  ): NotificationPayload | null {
    const title = this.getNotificationTitle(notification, profileDisplayName);
    const body = this.getNotificationBody(notification, context);

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

  private getNotificationBody(
    notification: KeriaNotification,
    context?: NotificationContext
  ): string {
    return getNotificationDisplayTextForPush(notification, context);
  }

  private handleNotificationTap(notification: LocalNotification): void {
    this.metrics.totalTapped++;
    this.debouncedProcessNotificationTap(notification);
  }

  private debouncedProcessNotificationTap = this.debounce(
    (notification: LocalNotification) => {
      this.processNotificationTap(notification);
    },
    this.DEBOUNCE_DELAY_MS
  );

  private async processNotificationTap(
    notification: LocalNotification
  ): Promise<void> {
    const extra = notification.extra || {};
    const profileId = extra.profileId;

    const notificationId = notification.id.toString();
    await this.removeShownNotification(notificationId);

    if (profileId && this.profileSwitcher) {
      this.targetProfileIdForColdStart = profileId;
      this.profileSwitcher(profileId);
    }

    setTimeout(() => {
      if (this.navigator) {
        try {
          this.navigator(TabsRoutePath.NOTIFICATIONS);
        } catch (error) {
          this.updateMetricsOnError("Navigation failed");
          showError("Failed to navigate via navigator", error);
          window.location.hash = TabsRoutePath.NOTIFICATIONS;
        }
      } else {
        window.location.hash = TabsRoutePath.NOTIFICATIONS;
      }
    }, this.NAVIGATION_DELAY_MS);
  }

  async clearAllDeliveredNotifications(): Promise<void> {
    try {
      await LocalNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      this.updateMetricsOnError("Failed to clear notifications");
      showError("Failed to clear delivered notifications", error);
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: parseInt(notificationId) }],
      });
    } catch (error) {
      this.updateMetricsOnError("Failed to cancel notification");
      showError("Failed to cancel notification", error);
    }
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      this.processNotificationQueue();
    }, this.QUEUE_PROCESS_INTERVAL_MS);
  }

  private async processNotificationQueue(): Promise<void> {
    if (this.processingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      const queuedNotification = this.notificationQueue.shift();
      if (queuedNotification) {
        await this.scheduleNotificationImmediately(queuedNotification.payload);
      }
    } catch (error) {
      this.updateMetricsOnError("Queue processing failed");
    } finally {
      this.processingQueue = false;
    }
  }

  private async scheduleNotificationImmediately(
    payload: NotificationPayload
  ): Promise<void> {
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
            largeIcon: "res://drawable/notification_icon",
            smallIcon: "res://drawable/notification_small",
            iconColor: "#4630EB",
            ongoing: false,
            autoCancel: true,
            channelId: "veridian-notifications",
          },
        ],
      });

      this.metrics.totalScheduled++;
    } catch (error) {
      this.updateMetricsOnError("Failed to schedule notification");
      throw error;
    }
  }

  private updateMetricsOnError(error: string): void {
    this.metrics.lastError = error;
  }

  private debounce<T extends unknown[]>(
    func: (...args: T) => void,
    delay: number
  ): (...args: T) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  getMetrics(): NotificationMetrics {
    return { ...this.metrics };
  }

  async getActiveNotifications(): Promise<LocalNotification[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      this.updateMetricsOnError("Failed to get active notifications");
      return [];
    }
  }

  async getDeliveredNotifications(): Promise<LocalNotification[]> {
    try {
      const result = await LocalNotifications.getDeliveredNotifications();
      return result.notifications;
    } catch (error) {
      this.updateMetricsOnError("Failed to get delivered notifications");
      return [];
    }
  }

  async arePermissionsGranted(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      const granted = result.display === "granted";

      this.permissionsGranted = granted;

      return granted;
    } catch (error) {
      return false;
    }
  }

  private async getShownNotifications(): Promise<Set<string>> {
    try {
      const shownRecord = await Agent.agent.basicStorage.findById(
        MiscRecordId.SHOWN_NOTIFICATIONS
      );
      if (shownRecord && shownRecord.content.notificationIds) {
        const notificationIds = shownRecord.content.notificationIds as string[];
        return new Set<string>(notificationIds);
      }
      return new Set<string>();
    } catch (error) {
      return new Set<string>();
    }
  }

  private async saveShownNotifications(
    shownNotifications: Set<string>
  ): Promise<void> {
    try {
      const arrayToSave = Array.from(shownNotifications);

      const content = { notificationIds: arrayToSave };
      await Agent.agent.basicStorage.save({
        id: MiscRecordId.SHOWN_NOTIFICATIONS,
        content,
        tags: { type: "shown_notifications" },
      });
    } catch (error) {
      this.updateMetricsOnError("Failed to save shown notifications");
    }
  }

  private async markNotificationAsShown(notificationId: string): Promise<void> {
    const shownNotifications = await this.getShownNotifications();
    shownNotifications.add(notificationId);
    await this.saveShownNotifications(shownNotifications);
  }

  private async isNotificationAlreadyShown(
    notificationId: string
  ): Promise<boolean> {
    const shownNotifications = await this.getShownNotifications();
    if (shownNotifications.has(notificationId)) {
      return true;
    }

    try {
      const deliveredNotifications = await this.getDeliveredNotifications();
      const isDelivered = deliveredNotifications.some(
        (notification) => notification.id.toString() === notificationId
      );
      if (isDelivered) {
        await this.markNotificationAsShown(notificationId);
        return true;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to check delivered notifications:", error);
    }

    return false;
  }

  private async removeShownNotification(notificationId: string): Promise<void> {
    const shownNotifications = await this.getShownNotifications();
    shownNotifications.delete(notificationId);
    await this.saveShownNotifications(shownNotifications);
  }

  async clearShownNotifications(): Promise<void> {
    try {
      await Agent.agent.basicStorage.deleteById(
        MiscRecordId.SHOWN_NOTIFICATIONS
      );
    } catch (error) {
      this.updateMetricsOnError("Failed to clear shown notifications");
    }
  }

  async cleanupShownNotifications(
    currentNotificationIds: string[]
  ): Promise<void> {
    const shownNotifications = await this.getShownNotifications();
    const currentIds = new Set(currentNotificationIds);
    let hasChanges = false;

    for (const notificationId of shownNotifications) {
      if (!currentIds.has(notificationId)) {
        shownNotifications.delete(notificationId);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await this.saveShownNotifications(shownNotifications);
    }
  }

  private processPendingColdStartNotification(): void {
    if (
      this.pendingColdStartNotification &&
      this.profileSwitcher &&
      this.navigator
    ) {
      const data = this.pendingColdStartNotification;
      this.pendingColdStartNotification = null;

      this.removeShownNotification(data.notificationId).catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(
          "Failed to remove shown notification during cold start:",
          error
        );
      });

      if (this.profileSwitcher) {
        this.profileSwitcher(data.profileId);
      }

      setTimeout(() => {
        if (this.navigator) {
          try {
            this.navigator(TabsRoutePath.NOTIFICATIONS);
          } catch (error) {
            this.updateMetricsOnError("Cold start navigation failed");
            showError("Failed to navigate via navigator", error);
            window.location.hash = TabsRoutePath.NOTIFICATIONS;
          }
        } else {
          window.location.hash = TabsRoutePath.NOTIFICATIONS;
        }

        setTimeout(() => {
          this.isColdStartProcessing = false;
        }, 500);
      }, this.COLD_START_DELAY_MS);
    }
  }

  hasPendingColdStart(): boolean {
    return (
      this.isColdStartProcessing || this.pendingColdStartNotification !== null
    );
  }

  getTargetProfileIdForColdStart(): string | null {
    return this.targetProfileIdForColdStart;
  }

  clearTargetProfileIdForColdStart(): void {
    this.targetProfileIdForColdStart = null;
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
