import { LocalNotifications } from "@capacitor/local-notifications";
import { notificationService } from "./notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { Agent } from "../agent/agent";
import { MiscRecordId } from "../agent/agent.types";

jest.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    requestPermissions: jest.fn(),
    schedule: jest.fn(),
    addListener: jest.fn(),
    removeAllDeliveredNotifications: jest.fn(),
    cancel: jest.fn(),
  },
}));

jest.mock("@capacitor/app", () => ({
  App: {
    addListener: jest.fn(),
    getState: jest.fn(() => Promise.resolve({ isActive: true })),
  },
}));

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    getPlatform: jest.fn(() => "web"),
  },
}));

jest.mock("../agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        deleteById: jest.fn(),
      },
    },
  },
}));

jest.mock("react-router-dom", () => ({
  useHistory: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
    length: 1,
    action: "PUSH",
    location: { pathname: "/", search: "", hash: "", state: null },
  })),
}));

jest.mock("i18next", () => ({
  t: (key: string, params?: any) => {
    if (key.includes("fallback")) return "New notification";
    if (key.includes("multisigicp")) return "Multisig request";
    if (key.includes("exnipexgrant")) return "Credential offer";
    if (key.includes("unknown")) return "Unknown";
    return `Notification: ${key}`;
  },
}));

describe("NotificationService", () => {
  const mockBasicStorage = Agent.agent.basicStorage as jest.Mocked<
    typeof Agent.agent.basicStorage
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    (notificationService as any).history = null;
    (notificationService as any).permissionsGranted = true;
    (notificationService as any).notificationQueue = [];
    (notificationService as any).coldStartState = "IDLE";

    mockBasicStorage.findById.mockResolvedValue(null);
    mockBasicStorage.save.mockResolvedValue({} as any);
    mockBasicStorage.deleteById.mockResolvedValue();
  });

  describe("requestPermissions", () => {
    it("should request permissions successfully", async () => {
      const mockResult = { display: "granted" };
      (LocalNotifications.requestPermissions as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await notificationService.requestPermissions();

      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should handle permission denied", async () => {
      const mockResult = { display: "denied" };
      (LocalNotifications.requestPermissions as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await notificationService.requestPermissions();

      expect(result).toBe(false);
    });

    it("should handle permission errors", async () => {
      const error = new Error("Permission error");
      (LocalNotifications.requestPermissions as jest.Mock).mockRejectedValue(
        error
      );

      const result = await notificationService.requestPermissions();

      expect(result).toBe(false);
    });
  });

  describe("scheduleNotification", () => {
    it("should enqueue a notification when permissions granted", async () => {
      const payload = {
        notificationId: "1",
        profileId: "profile-123",
        type: "general" as const,
        title: "Test Notification",
        body: "Test body",
        route: "/test",
      };

      await notificationService.scheduleNotification(payload);

      const queue = (notificationService as any).notificationQueue;
      expect(queue.length).toBe(1);
      expect(queue[0].payload).toEqual(payload);
    });

    it("should not enqueue when permissions not granted", async () => {
      (notificationService as any).permissionsGranted = false;

      const payload = {
        notificationId: "1",
        profileId: "profile-123",
        type: "general" as const,
        title: "Test Notification",
        body: "Test body",
      };

      await notificationService.scheduleNotification(payload);

      const queue = (notificationService as any).notificationQueue;
      expect(queue.length).toBe(0);
    });
  });

  describe("showLocalNotification", () => {
    it("should show local notification for KERIA notification from different profile", async () => {
      mockBasicStorage.findById.mockResolvedValue(null);

      const keriaNotification: KeriaNotification = {
        id: "test",
        createdAt: "2025-01-01T10:00:00Z",
        a: { r: "/multisig/icp", d: "connection-id", m: "Test message" },
        connectionId: "conn-123",
        read: false,
        groupReplied: false,
        receivingPre: "profile",
      };

      (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
        notifications: [],
      });

      await notificationService.showLocalNotification(
        keriaNotification,
        "different-profile",
        "Test Profile",
        {
          connectionsCache: [
            {
              id: "connection-id",
              label: "Test Connection",
            },
          ],
          multisigConnectionsCache: [],
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(LocalNotifications.schedule).toHaveBeenCalled();
    });
  });

  describe("clearAllDeliveredNotifications", () => {
    it("should clear all delivered notifications", async () => {
      (
        LocalNotifications.removeAllDeliveredNotifications as jest.Mock
      ).mockResolvedValue({});

      await notificationService.clearAllDeliveredNotifications();

      expect(
        LocalNotifications.removeAllDeliveredNotifications
      ).toHaveBeenCalled();
    });

    it("should handle clear errors", async () => {
      const error = new Error("Clear error");
      (
        LocalNotifications.removeAllDeliveredNotifications as jest.Mock
      ).mockRejectedValue(error);

      await expect(
        notificationService.clearAllDeliveredNotifications()
      ).resolves.toBeUndefined();
    });
  });

  describe("cancelNotification", () => {
    it("should cancel a specific notification", async () => {
      (LocalNotifications.cancel as jest.Mock).mockResolvedValue({});

      await notificationService.cancelNotification("1");

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [{ id: 1 }],
      });
    });

    it("should handle cancel errors", async () => {
      const error = new Error("Cancel error");
      (LocalNotifications.cancel as jest.Mock).mockRejectedValue(error);

      await expect(
        notificationService.cancelNotification("1")
      ).resolves.toBeUndefined();
    });
  });

  describe("private methods via showLocalNotification", () => {
    const mockCacheData = {
      connectionsCache: [{ id: "conn-123", label: "Test Connection" }],
      multisigConnectionsCache: [],
    };

    beforeEach(() => {
      mockBasicStorage.findById.mockResolvedValue(null);
    });

    it("should map multisig notifications correctly", async () => {
      const notification: KeriaNotification = {
        id: "test",
        createdAt: "2025-01-01T10:00:00Z",
        a: { r: "/multisig/icp", d: "conn-123", m: "Multisig message" },
        connectionId: "conn-123",
        read: false,
        groupReplied: false,
        receivingPre: "profile",
      };

      (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
        notifications: [],
      });

      await notificationService.showLocalNotification(
        notification,
        "different-profile",
        "Test Profile",
        mockCacheData
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(LocalNotifications.schedule).toHaveBeenCalled();
      const scheduleCall = (LocalNotifications.schedule as jest.Mock).mock
        .calls[0][0];
      const scheduledNotification = scheduleCall.notifications[0];

      expect(scheduledNotification.title).toBe("Test Profile");
      expect(scheduledNotification.actionTypeId).toBe("default");
    });

    it("should map credential notifications correctly", async () => {
      const notification: KeriaNotification = {
        id: "test",
        createdAt: "2025-01-01T10:00:00Z",
        a: { r: "/credential/iss", d: "conn-123", m: "Credential message" },
        connectionId: "conn-123",
        read: false,
        groupReplied: false,
        receivingPre: "profile",
      };

      (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
        notifications: [],
      });

      await notificationService.showLocalNotification(
        notification,
        "different-profile",
        "Test Profile",
        mockCacheData
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(LocalNotifications.schedule).toHaveBeenCalled();
      const scheduleCall = (LocalNotifications.schedule as jest.Mock).mock
        .calls[0][0];
      const scheduledNotification = scheduleCall.notifications[0];

      expect(scheduledNotification.title).toBe("Test Profile");
      expect(scheduledNotification.actionTypeId).toBe("default");
    });

    it("should handle unknown notification types", async () => {
      const notification: KeriaNotification = {
        id: "test",
        createdAt: "2025-01-01T10:00:00Z",
        a: { r: "/unknown/type", d: "conn-123", m: "Unknown message" },
        connectionId: "conn-123",
        read: false,
        groupReplied: false,
        receivingPre: "profile",
      };

      (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
        notifications: [],
      });

      await notificationService.showLocalNotification(
        notification,
        "different-profile",
        "Test Profile",
        mockCacheData
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(LocalNotifications.schedule).toHaveBeenCalled();
      const scheduleCall = (LocalNotifications.schedule as jest.Mock).mock
        .calls[0][0];
      const scheduledNotification = scheduleCall.notifications[0];

      expect(scheduledNotification.title).toBe("Test Profile");
      expect(scheduledNotification.actionTypeId).toBe("default");
    });
  });

  describe("notification tap handling", () => {
    let mockNavigator: jest.Mock;

    beforeEach(() => {
      mockNavigator = jest.fn();
      notificationService.setNavigator(mockNavigator);

      Object.defineProperty(window, "location", {
        value: { hash: "" },
        writable: true,
      });
    });

    it("should navigate to notifications when notification is tapped", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          route: "/credentials",
        },
      };

      (notificationService as any).handleNotificationTap(notification);

      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(500);

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications");

      jest.useRealTimers();
    });

    it("should navigate to notifications when no route specified", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {},
      };

      (notificationService as any).handleNotificationTap(notification);

      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(500);

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications");

      jest.useRealTimers();
    });

    it("should process notification tap immediately", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          profileId: "test-profile",
        },
      };

      (notificationService as any).handleNotificationTap(notification);

      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(500);

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications");

      jest.useRealTimers();
    });
  });

  describe("cold start handling", () => {
    let mockProfileSwitcher: jest.Mock;
    let mockNavigator: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      mockProfileSwitcher = jest.fn();
      mockNavigator = jest.fn();
      notificationService.setProfileSwitcher(mockProfileSwitcher);
      notificationService.setNavigator(mockNavigator);
      (notificationService as any).coldStartState = "IDLE";
      (notificationService as any).pendingColdStartNotification = null;
      (notificationService as any).targetProfileIdForColdStart = null;
    });

    it("should detect cold start state", () => {
      (notificationService as any).coldStartState = "PROCESSING";
      expect(notificationService.hasPendingColdStart()).toBe(true);
    });

    it("should return false when not in cold start", () => {
      (notificationService as any).coldStartState = "IDLE";
      expect(notificationService.hasPendingColdStart()).toBe(false);
    });

    it("should store target profile during notification tap", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          profileId: "profile-123",
          notificationId: "notif-1",
        },
      };

      (notificationService as any).processNotificationTap(
        notification,
        false,
        false
      );

      const stored = notificationService.getTargetProfileIdForColdStart();
      expect(stored).toBe("profile-123");

      jest.useRealTimers();
    });

    it("should clear target profile after use", () => {
      (notificationService as any).targetProfileIdForColdStart = "profile-123";
      notificationService.clearTargetProfileIdForColdStart();

      const stored = notificationService.getTargetProfileIdForColdStart();
      expect(stored).toBeNull();
    });

    it("should enter processing state and complete on signal", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          profileId: "profile-123",
          notificationId: "notif-1",
        },
      };

      (notificationService as any).handleNotificationTap(notification);

      jest.advanceTimersByTime(100);

      expect(notificationService.hasPendingColdStart()).toBe(true);

      notificationService.completeColdStart();

      expect(notificationService.hasPendingColdStart()).toBe(false);

      jest.useRealTimers();
    });

    it("should trigger cold start processing when app state changes", () => {
      (notificationService as any).coldStartState = "PROCESSING";
      (notificationService as any).pendingColdStartNotification = {
        profileId: "profile-123",
        notificationId: "notif-1",
      };

      (notificationService as any).processPendingColdStartNotification();

      expect(mockProfileSwitcher).toHaveBeenCalledWith("profile-123");
    });

    it("should not process when no pending cold start", () => {
      (notificationService as any).coldStartState = "IDLE";
      (notificationService as any).pendingColdStartNotification = null;

      (notificationService as any).processPendingColdStartNotification();

      expect(mockProfileSwitcher).not.toHaveBeenCalled();
      expect(mockNavigator).not.toHaveBeenCalled();
    });
  });

  describe("notification shown tracking", () => {
    beforeEach(() => {
      mockBasicStorage.findById.mockResolvedValue(null);
    });

    it("should mark notification as shown", async () => {
      const notificationId = "test-notification-1";

      let savedNotifications: string[] = [];
      mockBasicStorage.save.mockImplementation(async (record: any) => {
        savedNotifications = record.content.notificationIds;
        return record;
      });

      mockBasicStorage.findById.mockImplementation(async (id: string) => {
        if (
          id === MiscRecordId.SHOWN_NOTIFICATIONS &&
          savedNotifications.length > 0
        ) {
          return {
            id,
            content: { notificationIds: savedNotifications },
          } as any;
        }
        return null;
      });

      await notificationService.markAsShown(notificationId);

      const isShown = await notificationService.isNotificationShown(
        notificationId
      );
      expect(isShown).toBe(true);
    });

    it("should detect already shown notifications", async () => {
      const notificationId = "test-notification-1";

      let savedNotifications: string[] = [];
      mockBasicStorage.save.mockImplementation(async (record: any) => {
        savedNotifications = record.content.notificationIds;
        return record;
      });

      mockBasicStorage.findById.mockImplementation(async (id: string) => {
        if (
          id === MiscRecordId.SHOWN_NOTIFICATIONS &&
          savedNotifications.length > 0
        ) {
          return {
            id,
            content: { notificationIds: savedNotifications },
          } as any;
        }
        return null;
      });

      await notificationService.markAsShown(notificationId);

      const isShown = await notificationService.isNotificationShown(
        notificationId
      );
      expect(isShown).toBe(true);

      const isShownAgain = await notificationService.isNotificationShown(
        notificationId
      );
      expect(isShownAgain).toBe(true);
    });

    it("should return false for notifications not yet shown", async () => {
      const notificationId = "not-shown-notification";

      mockBasicStorage.findById.mockResolvedValue(null);

      const isShown = await notificationService.isNotificationShown(
        notificationId
      );
      expect(isShown).toBe(false);
    });

    it("should cleanup old shown notifications", async () => {
      let savedNotifications: string[] = [];
      mockBasicStorage.save.mockImplementation(async (record: any) => {
        savedNotifications = record.content.notificationIds;
        return record;
      });

      mockBasicStorage.findById.mockImplementation(async (id: string) => {
        if (
          id === MiscRecordId.SHOWN_NOTIFICATIONS &&
          savedNotifications.length > 0
        ) {
          return {
            id,
            content: { notificationIds: savedNotifications },
          } as any;
        }
        return null;
      });

      await notificationService.markAsShown("old-notification-1");
      await notificationService.markAsShown("old-notification-2");
      await notificationService.markAsShown("current-notification");

      const currentNotificationIds = ["current-notification"];

      await notificationService.cleanupShownNotifications(
        currentNotificationIds
      );

      const isOld1Shown = await notificationService.isNotificationShown(
        "old-notification-1"
      );
      const isOld2Shown = await notificationService.isNotificationShown(
        "old-notification-2"
      );
      const isCurrentShown = await notificationService.isNotificationShown(
        "current-notification"
      );

      expect(isOld1Shown).toBe(false);
      expect(isOld2Shown).toBe(false);
      expect(isCurrentShown).toBe(true);
    });
  });

  describe("profile switching scenarios", () => {
    let mockProfileSwitcher: jest.Mock;
    let mockNavigator: jest.Mock;
    let savedNotifications: string[] = [];

    beforeEach(() => {
      mockProfileSwitcher = jest.fn();
      mockNavigator = jest.fn();
      notificationService.setProfileSwitcher(mockProfileSwitcher);
      notificationService.setNavigator(mockNavigator);
      (notificationService as any).coldStartState = "IDLE";
      savedNotifications = [];

      mockBasicStorage.save.mockImplementation(async (record: any) => {
        savedNotifications = record.content.notificationIds;
        return record;
      });

      mockBasicStorage.findById.mockImplementation(async (id: string) => {
        if (
          id === MiscRecordId.SHOWN_NOTIFICATIONS &&
          savedNotifications.length > 0
        ) {
          return {
            id,
            content: { notificationIds: savedNotifications },
          } as any;
        }
        return null;
      });
    });

    it("should switch profiles when tapping notification from different profile", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          profileId: "profile-bob",
          notificationId: "notif-1",
        },
      };

      (notificationService as any).processNotificationTap(
        notification,
        false,
        false
      );

      expect(mockProfileSwitcher).toHaveBeenCalledWith("profile-bob");

      jest.advanceTimersByTime(500);

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications");

      jest.useRealTimers();
    });

    it("should not show duplicate notifications after profile switch", async () => {
      const notificationId = "notif-1";

      await notificationService.markAsShown(notificationId);

      const isShown = await notificationService.isNotificationShown(
        notificationId
      );
      expect(isShown).toBe(true);
    });

    it("should suppress current profile notifications", async () => {
      const currentProfileNotificationId = "notif-alice-1";

      await notificationService.markAsShown(currentProfileNotificationId);

      const isShown = await notificationService.isNotificationShown(
        currentProfileNotificationId
      );
      expect(isShown).toBe(true);
    });
  });

  describe("timing constants", () => {
    it("should use correct navigation delay", () => {
      expect((notificationService as any).NAVIGATION_DELAY_MS).toBe(500);
    });

    it("should use correct cold start delay", () => {
      expect((notificationService as any).COLD_START_DELAY_MS).toBe(1000);
    });

    it("should use correct debounce delay", () => {
      expect((notificationService as any).DEBOUNCE_DELAY_MS).toBe(100);
    });

    it("should use correct queue process interval", () => {
      expect((notificationService as any).QUEUE_PROCESS_INTERVAL_MS).toBe(1000);
    });
  });
});
