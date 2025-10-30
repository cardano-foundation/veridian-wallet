import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { TabsRoutePath } from "../../routes/paths";
import { showError } from "../../ui/utils/error";
import { Agent } from "../../core/agent/agent";
import { MiscRecordId } from "../../core/agent/agent.types";
import { BasicRecord } from "../../core/agent/records";
import {
  NotificationContext,
  getNotificationDisplayTextForPush,
} from "./notificationUtils";
import {
  ColdStartState,
  NotificationPayload,
  LocalNotification,
} from "./notificationService.types";

class NotificationService {
  private profileSwitcher: ((profileId: string) => void) | null = null;
  private navigator: ((path: string, notificationId?: string) => void) | null =
    null;
  private notificationQueue: NotificationPayload[] = [];
  private processingQueue = false;
  private permissionsGranted = false;
  private pendingColdStartNotification: {
    profileId: string;
    notificationId: string;
  } | null = null;
  private coldStartState: ColdStartState = ColdStartState.IDLE;
  private targetProfileIdForColdStart: string | null = null;
  private warmTargetProfileId: string | null = null;
  private profileSwitchInProgress = false;
  private coldStartCompletedAt: number | null = null;
  private readonly NAVIGATION_DELAY_MS = 500;
  private readonly COLD_START_DELAY_MS = 1000;
  private readonly DEBOUNCE_DELAY_MS = 100;
  private readonly COLD_START_SUPPRESSION_MS = 2000;

  constructor() {
    this.initialize();
  }

  setProfileSwitcher(profileSwitcher: (profileId: string) => void) {
    this.profileSwitcher = profileSwitcher;
    this.processPendingColdStartNotification();
  }

  setNavigator(navigator: (path: string, notificationId?: string) => void) {
    this.navigator = navigator;
    this.processPendingColdStartNotification();
  }

  private async initialize() {
    this.permissionsGranted = await this.requestPermissions();

    await this.createNotificationChannel();

    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        this.debouncedProcessNotificationTap(
          event.notification as LocalNotification
        );
      }
    );
  }

  private async createNotificationChannel(): Promise<void> {
    const platform = Capacitor.getPlatform();
    if (platform !== "android") {
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
    } catch (error) {
      showError("Failed to create notification channel", error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      this.permissionsGranted = result.display === "granted";

      return this.permissionsGranted;
    } catch (error) {
      showError("Failed to request notification permissions", error);
      return false;
    }
  }

  async scheduleNotification(payload: NotificationPayload): Promise<void> {
    if (!this.permissionsGranted) {
      return;
    }

    const existingIndex = this.notificationQueue.findIndex(
      (queued) => queued.notificationId === payload.notificationId
    );

    if (existingIndex !== -1) {
      if (
        this.notificationQueue[existingIndex].timestamp !== payload.timestamp
      ) {
        this.notificationQueue[existingIndex] = payload;
      }
      return;
    }

    const insertIndex = this.notificationQueue.findIndex(
      (queued) => queued.timestamp > payload.timestamp
    );

    if (insertIndex === -1) {
      this.notificationQueue.push(payload);
    } else {
      this.notificationQueue.splice(insertIndex, 0, payload);
    }

    this.processNotificationQueue();
  }

  async showLocalNotification(
    keriaNotification: KeriaNotification,
    currentProfileId: string,
    profileDisplayName: string,
    context?: NotificationContext
  ): Promise<void> {
    try {
      const state = await App.getState();
      if (!state.isActive) {
        return;
      }
    } catch (error) {
      showError("Can't determine app state", error);
    }

    if (this.coldStartState === ColdStartState.PROCESSING) {
      return;
    }

    // @Important - s.disalvo: Suppress push notifications for 2 seconds after cold start to avoid showing notifications for other profiles immediately
    if (
      this.coldStartCompletedAt &&
      Date.now() - this.coldStartCompletedAt < this.COLD_START_SUPPRESSION_MS
    ) {
      return;
    }

    if (keriaNotification.receivingPre === currentProfileId) {
      await this.markNotificationAsShown(keriaNotification.id);
      return;
    }

    const alreadyShown = await this.isNotificationAlreadyShown(
      keriaNotification.id
    );

    if (alreadyShown) {
      return;
    }

    const payload: NotificationPayload = {
      notificationId: keriaNotification.id,
      profileId: keriaNotification.receivingPre,
      title: profileDisplayName,
      body: getNotificationDisplayTextForPush(keriaNotification, context),
      timestamp: new Date(keriaNotification.createdAt).getTime(),
    };

    if (payload) {
      await this.scheduleNotification(payload);
      await this.markNotificationAsShown(keriaNotification.id);
    }
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
    const extra = notification.extra;
    const profileId = extra.profileId;

    const handlersReady =
      Boolean(this.profileSwitcher) && Boolean(this.navigator);

    if (!handlersReady) {
      if (profileId) {
        this.targetProfileIdForColdStart = profileId;
      }
      this.coldStartState = ColdStartState.PROCESSING;
      this.pendingColdStartNotification = {
        profileId: profileId || "",
        notificationId: String(notification.id),
      };
      return;
    }

    this.profileSwitchInProgress = true;
    this.warmTargetProfileId = profileId || null;
    this.targetProfileIdForColdStart = null;

    if (profileId && this.profileSwitcher) {
      this.profileSwitcher(profileId);
      this.clearDeliveredNotificationsForProfile(profileId);
    }

    setTimeout(() => {
      if (this.navigator) {
        try {
          this.navigator(TabsRoutePath.NOTIFICATIONS, String(notification.id));
        } catch (error) {
          showError("Failed to navigate via navigator", error);
          window.location.hash = TabsRoutePath.NOTIFICATIONS;
        }
      } else {
        window.location.hash = TabsRoutePath.NOTIFICATIONS;
      }
    }, this.NAVIGATION_DELAY_MS);
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

  private async processNotificationQueue(): Promise<void> {
    if (this.processingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.notificationQueue.length > 0) {
        const payload = this.notificationQueue.shift();
        if (payload) {
          await this.scheduleNotificationImmediately(payload);
        }
      }
    } catch (error) {
      showError("Queue processing failed", error);
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
            channelId: "veridian-notifications",
          },
        ],
      });
    } catch (error) {
      showError("Failed to schedule notification", error);
    }
  }

  async clearDeliveredNotificationsForProfile(
    profileId: string
  ): Promise<void> {
    try {
      const delivered = await LocalNotifications.getDeliveredNotifications();
      const toCancel = delivered.notifications
        .filter((n) => n.extra.profileId === profileId)
        .map((n) => ({ id: n.id }));

      if (toCancel.length > 0) {
        await LocalNotifications.cancel({ notifications: toCancel });
      }
    } catch (error) {
      showError("Failed to clear delivered notifications for profile", error);
    }
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

  async getActiveNotifications(): Promise<LocalNotification[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications as LocalNotification[];
    } catch (error) {
      return [];
    }
  }

  async getDeliveredNotifications(): Promise<LocalNotification[]> {
    try {
      const result = await LocalNotifications.getDeliveredNotifications();
      return result.notifications as LocalNotification[];
    } catch (error) {
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
    const shownRecord = await Agent.agent.basicStorage.findById(
      MiscRecordId.SHOWN_NOTIFICATIONS
    );

    if (shownRecord?.content?.notificationIds) {
      const notificationIds = shownRecord.content.notificationIds;
      if (
        Array.isArray(notificationIds) &&
        notificationIds.every((id) => typeof id === "string")
      ) {
        return new Set<string>(notificationIds);
      }
    }

    return new Set<string>();
  }

  private async saveShownNotifications(
    shownNotifications: Set<string>
  ): Promise<void> {
    const arrayToSave = Array.from(shownNotifications);

    const record = new BasicRecord({
      id: MiscRecordId.SHOWN_NOTIFICATIONS,
      content: { notificationIds: arrayToSave },
      tags: { type: "shown_notifications" },
    });

    await Agent.agent.basicStorage.createOrUpdateBasicRecord(record);
  }

  private async markNotificationAsShown(notificationId: string): Promise<void> {
    const shownNotifications = await this.getShownNotifications();
    shownNotifications.add(notificationId);
    await this.saveShownNotifications(shownNotifications);

    await this.cancelNotification(notificationId);
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
      showError("Failed to check delivered notifications:", error);
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
      showError("Failed to clear shown notifications", error);
    }
  }

  async cleanupShownNotifications(
    currentNotificationIds: string[]
  ): Promise<void> {
    if (currentNotificationIds.length === 0) {
      return;
    }

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

      if (this.profileSwitcher && data.profileId) {
        this.profileSwitcher(data.profileId);
        this.clearDeliveredNotificationsForProfile(data.profileId);
      }

      setTimeout(() => {
        if (this.navigator) {
          try {
            this.navigator(TabsRoutePath.NOTIFICATIONS, data.notificationId);
          } catch (error) {
            showError("Failed to navigate via navigator", error);
            window.location.hash = TabsRoutePath.NOTIFICATIONS;
          }
        } else {
          window.location.hash = TabsRoutePath.NOTIFICATIONS;
        }
      }, this.COLD_START_DELAY_MS);
    }
  }

  completeColdStart(): void {
    this.coldStartState = ColdStartState.READY;
    this.coldStartCompletedAt = Date.now();
  }

  hasPendingColdStart(): boolean {
    return (
      this.coldStartState === ColdStartState.PROCESSING ||
      this.pendingColdStartNotification !== null
    );
  }

  setColdStartHandled(): void {
    this.coldStartState = ColdStartState.IDLE;
  }

  getTargetProfileIdForColdStart(): string | null {
    return this.targetProfileIdForColdStart;
  }

  clearTargetProfileIdForColdStart(): void {
    this.targetProfileIdForColdStart = null;
  }

  isProfileSwitchInProgress(): boolean {
    return this.profileSwitchInProgress;
  }

  getTargetProfileIdForWarmSwitch(): string | null {
    return this.warmTargetProfileId;
  }

  setProfileSwitchComplete(): void {
    this.profileSwitchInProgress = false;
    this.warmTargetProfileId = null;
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
