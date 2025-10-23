import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

enum NotificationLogContext {
  ColdStart = "ColdStart",
  WarmTap = "WarmTap",
  Scheduling = "Scheduling",
  Queue = "Queue",
}

enum NotificationLogSeverity {
  Debug = "DEBUG",
  Warn = "WARN",
  Error = "ERROR",
}
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
  private readonly COLD_START_PROCESSING_CLEAR_DELAY_MS = 10000;
  private readonly DEBUG_LOGGING_ENABLED =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV !== "production";

  constructor() {
    this.initialize();
    this.startQueueProcessor();
  }

  private debugLog(
    message: string,
    options?: {
      details?: Record<string, unknown>;
      context?: NotificationLogContext;
      severity?: NotificationLogSeverity;
    }
  ): void {
    if (!this.DEBUG_LOGGING_ENABLED) {
      return;
    }

    const context = options?.context ? `[${options.context}] ` : "";
    const severity = options?.severity || NotificationLogSeverity.Debug;
    const prefix = `[NotificationService] ${severity} ${context}${message}`;
    const payload = options?.details ? [options.details] : [];
    // eslint-disable-next-line no-console
    console.log(prefix, ...payload);
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
    const platform = Capacitor.getPlatform();
    if (platform !== "android") {
      this.debugLog("Skipping notification channel creation", {
        details: { platform },
      });
      return;
    }

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
      this.debugLog("Notification channel created", {
        details: { platform },
      });
    } catch (error) {
      this.debugLog("Failed to create notification channel", {
        details: {
          platform,
          error: error instanceof Error ? error.message : String(error),
        },
        severity: NotificationLogSeverity.Warn,
      });
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
      this.debugLog("Queue rejected - permissions not granted", {
        details: {
          notificationId: payload.notificationId,
        },
        context: NotificationLogContext.Queue,
      });
      return;
    }

    const queuedNotification: QueuedNotification = {
      payload,
      timestamp: Date.now(),
    };

    this.notificationQueue.push(queuedNotification);
    this.debugLog("Notification enqueued", {
      context: NotificationLogContext.Queue,
      details: {
        notificationId: payload.notificationId,
        queueLength: this.notificationQueue.length,
      },
    });
  }

  async showLocalNotification(
    keriaNotification: KeriaNotification,
    currentProfileId: string,
    profileDisplayName: string,
    context?: NotificationContext
  ): Promise<void> {
    const isAppActive = await this.isAppInForeground();
    if (!isAppActive) {
      this.debugLog("Skipping display - app inactive", {
        context: NotificationLogContext.Scheduling,
        details: {
          notificationId: keriaNotification.id,
        },
      });
      return;
    }

    if (this.isColdStartProcessing) {
      this.debugLog("Skipping display - cold start processing", {
        context: NotificationLogContext.ColdStart,
        details: {
          notificationId: keriaNotification.id,
        },
      });
      return;
    }

    if (keriaNotification.receivingPre === currentProfileId) {
      this.debugLog("Suppressing current profile notification", {
        context: NotificationLogContext.Scheduling,
        details: {
          notificationId: keriaNotification.id,
          profileId: currentProfileId,
        },
      });
      await this.markNotificationAsShown(keriaNotification.id);
      return;
    }

    const alreadyShown = await this.isNotificationAlreadyShown(
      keriaNotification.id
    );

    if (alreadyShown) {
      this.debugLog("Skipping already shown notification", {
        context: NotificationLogContext.Scheduling,
        details: {
          notificationId: keriaNotification.id,
        },
      });
      return;
    }

    const payload = this.mapKeriaNotificationToPayload(
      keriaNotification,
      profileDisplayName,
      context
    );

    if (payload) {
      this.debugLog("Queueing notification for display", {
        context: NotificationLogContext.Scheduling,
        details: {
          notificationId: keriaNotification.id,
          targetProfileId: keriaNotification.receivingPre,
        },
      });
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
    this.debugLog("Notification tap received", {
      context: NotificationLogContext.WarmTap,
      details: {
        notificationId: notification.id,
        hasProfileSwitcher: Boolean(this.profileSwitcher),
        hasNavigator: Boolean(this.navigator),
      },
    });
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

    this.isColdStartProcessing = true;
    this.debugLog("Processing notification tap", {
      context: NotificationLogContext.WarmTap,
      details: {
        notificationId: notification.id,
        profileId,
      },
    });

    if (profileId && this.profileSwitcher) {
      this.targetProfileIdForColdStart = profileId;
      this.debugLog("Profile switch requested from tap", {
        context: NotificationLogContext.WarmTap,
        details: {
          notificationId: notification.id,
          targetProfileId: profileId,
        },
      });
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

      setTimeout(() => {
        this.isColdStartProcessing = false;
        this.debugLog("Cold start processing cleared", {
          context: NotificationLogContext.WarmTap,
          details: {
            notificationId: notification.id,
          },
        });
      }, this.COLD_START_PROCESSING_CLEAR_DELAY_MS);
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
      this.debugLog("Notification scheduled immediately", {
        context: NotificationLogContext.Queue,
        details: {
          notificationId: payload.notificationId,
          profileId: payload.profileId,
          queueLength: this.notificationQueue.length,
        },
      });
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
    this.debugLog("Notification marked as shown", {
      context: NotificationLogContext.Scheduling,
      details: { notificationId },
    });

    if (!isNaN(Number(notificationId))) {
      try {
        await this.cancelNotification(notificationId);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to cancel notification:", error);
      }
    }
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

  async isNotificationShown(notificationId: string): Promise<boolean> {
    return this.isNotificationAlreadyShown(notificationId);
  }

  async markAsShown(notificationId: string): Promise<void> {
    return this.markNotificationAsShown(notificationId);
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
    const removed: string[] = [];

    for (const notificationId of shownNotifications) {
      if (!currentIds.has(notificationId)) {
        shownNotifications.delete(notificationId);
        hasChanges = true;
        removed.push(notificationId);
      }
    }

    if (hasChanges) {
      await this.saveShownNotifications(shownNotifications);
      this.debugLog("Cleaned up shown notifications", {
        context: NotificationLogContext.Queue,
        details: {
          removedCount: removed.length,
          removedIds: removed,
        },
      });
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
      this.debugLog("Processing pending cold start notification", {
        context: NotificationLogContext.ColdStart,
        details: {
          notificationId: data.notificationId,
          profileId: data.profileId,
        },
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
          this.debugLog("Cold start processing cleared", {
            context: NotificationLogContext.ColdStart,
            details: {
              notificationId: data.notificationId,
            },
          });
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
