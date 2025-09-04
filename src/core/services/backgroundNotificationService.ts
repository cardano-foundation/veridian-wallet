import { BackgroundTask } from "@capawesome/capacitor-background-task";
import { App } from "@capacitor/app";
import { Agent } from "../../core/agent/agent";
import { showError } from "../../ui/utils/error";

export class BackgroundNotificationService {
  private static instance: BackgroundNotificationService;
  private isRunning = false;
  private backgroundTaskId: string | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): BackgroundNotificationService {
    if (!BackgroundNotificationService.instance) {
      BackgroundNotificationService.instance =
        BackgroundNotificationService.createInstance();
    }
    return BackgroundNotificationService.instance;
  }

  private static createInstance(): BackgroundNotificationService {
    return new BackgroundNotificationService();
  }

  private async initialize(): Promise<void> {
    // Listen for app state changes to manage background tasks
    App.addListener("appStateChange", (state) => {
      if (state.isActive) {
        // App came to foreground - stop background tasks
        this.stopBackgroundTasks();
      } else {
        // App went to background - start background tasks
        this.startBackgroundTasks();
      }
    });

    // Start background tasks when service initializes
    await this.startBackgroundTasks();
  }

  private async startBackgroundTasks(): Promise<void> {
    if (this.isRunning) return;

    try {
      this.isRunning = true;

      // Register background task
      this.backgroundTaskId = await BackgroundTask.beforeExit(async () => {
        try {
          await this.performBackgroundCheck();
        } catch (error) {
          showError("Background notification check failed", error);
        } finally {
          // Schedule next background task
          if (this.backgroundTaskId) {
            BackgroundTask.finish({ taskId: this.backgroundTaskId });
          }
          this.scheduleNextBackgroundTask();
        }
      });
    } catch (error) {
      showError("Failed to start background tasks", error);
      this.isRunning = false;
    }
  }

  private stopBackgroundTasks(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.backgroundTaskId) {
      BackgroundTask.finish({ taskId: this.backgroundTaskId });
      this.backgroundTaskId = null;
    }
  }

  private async performBackgroundCheck(): Promise<void> {
    try {
      // Check if we have a valid agent and KERIA is online
      if (!Agent.agent || !Agent.agent.getKeriaOnlineStatus()) {
        return;
      }

      // Trigger the existing KERIA polling mechanism
      // This will automatically process any new notifications
      await Agent.agent.keriaNotifications.pollNotifications();

      // The KERIA service will emit events for new notifications
      // Our existing notification hooks will pick these up and show local notifications
    } catch (error) {
      showError("Background notification check failed", error);
    }
  }

  private async pollKeriaNotifications(): Promise<unknown[]> {
    // This method is no longer needed since we use the existing KERIA polling
    return [];
  }

  private async scheduleBackgroundNotifications(
    _notifications: unknown[]
  ): Promise<void> {
    // This method is no longer needed since notifications are handled by existing hooks
  }

  private scheduleNextBackgroundTask(): void {
    if (!this.isRunning) return;

    // Schedule next background task in 5 minutes (300000ms)
    // This is a reasonable interval that balances responsiveness with battery life
    setTimeout(() => {
      if (this.isRunning) {
        this.startBackgroundTasks();
      }
    }, 300000); // 5 minutes
  }

  // Public method to manually trigger background check (for testing)
  async triggerBackgroundCheck(): Promise<void> {
    await this.performBackgroundCheck();
  }

  // Public method to get background service status
  getStatus(): { isRunning: boolean; taskId: string | null } {
    return {
      isRunning: this.isRunning,
      taskId: this.backgroundTaskId,
    };
  }
}

// Export singleton instance
export const backgroundNotificationService =
  BackgroundNotificationService.getInstance();
