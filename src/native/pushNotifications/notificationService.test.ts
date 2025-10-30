import { LocalNotifications } from "@capacitor/local-notifications";
import { notificationService } from "./notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { Agent } from "../../core/agent/agent";
import { MiscRecordId } from "../../core/agent/agent.types";

jest.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    requestPermissions: jest.fn(() => Promise.resolve({ display: "granted" })),
    schedule: jest.fn(),
    addListener: jest.fn(),
    removeAllDeliveredNotifications: jest.fn(),
    cancel: jest.fn(),
    getPending: jest.fn(() => Promise.resolve({ notifications: [] })),
    getDeliveredNotifications: jest.fn(() =>
      Promise.resolve({ notifications: [] })
    ),
    checkPermissions: jest.fn(() => Promise.resolve({ display: "granted" })),
    createChannel: jest.fn(() => Promise.resolve()),
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

jest.mock("../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        deleteById: jest.fn(),
        createOrUpdateBasicRecord: jest.fn(),
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
    mockBasicStorage.createOrUpdateBasicRecord.mockResolvedValue();
  });

  describe("requestPermissions", () => {
    test("should request permissions successfully", async () => {
      const mockResult = { display: "granted" };
      (LocalNotifications.requestPermissions as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await notificationService.requestPermissions();

      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("should handle permission denied", async () => {
      const mockResult = { display: "denied" };
      (LocalNotifications.requestPermissions as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await notificationService.requestPermissions();

      expect(result).toBe(false);
    });
  });

  describe("scheduleNotification", () => {
    test("should enqueue a notification when permissions granted", async () => {
      const payload = {
        notificationId: "1",
        profileId: "profile-123",
        title: "Test Notification",
        body: "Test body",
        timestamp: Date.now(),
      };

      const processSpy = jest.spyOn(
        notificationService as any,
        "processNotificationQueue"
      );
      processSpy.mockResolvedValue(undefined);

      await notificationService.scheduleNotification(payload);

      const queue = (notificationService as any).notificationQueue;
      expect(queue.length).toBe(1);
      expect(queue[0]).toEqual(payload);

      processSpy.mockRestore();
    });

    test("should not enqueue when permissions not granted", async () => {
      (notificationService as any).permissionsGranted = false;

      const payload = {
        notificationId: "1",
        profileId: "profile-123",
        title: "Test Notification",
        body: "Test body",
        timestamp: Date.now(),
      };

      await notificationService.scheduleNotification(payload);

      const queue = (notificationService as any).notificationQueue;
      expect(queue.length).toBe(0);
    });
  });

  describe("showLocalNotification", () => {
    test("should show local notification for KERIA notification from different profile", async () => {
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

  describe("cancelNotification", () => {
    test("should cancel a specific notification", async () => {
      (LocalNotifications.cancel as jest.Mock).mockResolvedValue({});

      await notificationService.cancelNotification("1");

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [{ id: 1 }],
      });
    });
  });

  describe("cleanupShownNotifications", () => {
    test("should skip cleanup when no current notification ids", async () => {
      const saveSpy = jest.spyOn(
        notificationService as any,
        "saveShownNotifications"
      );

      await notificationService.cleanupShownNotifications([]);

      expect(saveSpy).not.toHaveBeenCalled();
      saveSpy.mockRestore();
    });

    test("should remove stale shown notifications", async () => {
      const shownIds = ["stale-id", "active-id"];
      mockBasicStorage.findById.mockResolvedValueOnce({
        content: { notificationIds: shownIds },
      } as any);

      mockBasicStorage.save.mockResolvedValueOnce({} as any);

      await notificationService.cleanupShownNotifications(["active-id"]);

      expect(mockBasicStorage.createOrUpdateBasicRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          id: MiscRecordId.SHOWN_NOTIFICATIONS,
          content: { notificationIds: ["active-id"] },
        })
      );
    });
  });

  describe("marking notifications", () => {
    test("should persist notification id and cancel local notification", async () => {
      mockBasicStorage.findById.mockResolvedValueOnce({
        content: { notificationIds: [] },
      } as any);

      mockBasicStorage.save.mockResolvedValueOnce({} as any);
      (LocalNotifications.cancel as jest.Mock).mockResolvedValue({});

      await notificationService.markAsShown("42");

      expect(mockBasicStorage.createOrUpdateBasicRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          id: MiscRecordId.SHOWN_NOTIFICATIONS,
          content: { notificationIds: ["42"] },
        })
      );
      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [{ id: 42 }],
      });
    });

    test("should report notification as shown when already stored", async () => {
      mockBasicStorage.findById.mockResolvedValueOnce({
        content: { notificationIds: ["abc"] },
      } as any);

      const result = await notificationService.isNotificationShown("abc");

      expect(result).toBe(true);
    });

    test("should detect shown notifications from delivered list", async () => {
      mockBasicStorage.findById.mockResolvedValueOnce(null as any);
      (
        LocalNotifications.getDeliveredNotifications as jest.Mock
      ).mockResolvedValueOnce({
        notifications: [{ id: 7 }],
      });

      const result = await notificationService.isNotificationShown("7");

      expect(result).toBe(true);
    });
  });

  describe("pending cold start processing", () => {
    test("should process pending notification when handlers set", () => {
      jest.useFakeTimers();

      const navigator = jest.fn();
      const profileSwitcher = jest.fn();

      notificationService.setNavigator(navigator);
      notificationService.setProfileSwitcher(profileSwitcher);

      (notificationService as any).pendingColdStartNotification = {
        profileId: "profile-1",
        notificationId: "notif-1",
      };

      (notificationService as any).processPendingColdStartNotification();

      expect(profileSwitcher).toHaveBeenCalledWith("profile-1");

      jest.advanceTimersByTime(1000);

      expect(navigator).toHaveBeenCalledWith("/tabs/notifications", "notif-1");

      jest.useRealTimers();
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

    test("should map different notification types correctly", async () => {
      const testCases = [
        {
          name: "multisig",
          notification: {
            id: "test-multisig",
            createdAt: "2025-01-01T10:00:00Z",
            a: { r: "/multisig/icp", d: "conn-123", m: "Multisig message" },
            connectionId: "conn-123",
            read: false,
            groupReplied: false,
            receivingPre: "profile",
          },
          expectedBody: "Multisig request",
        },
        {
          name: "credential",
          notification: {
            id: "test-credential",
            createdAt: "2025-01-01T10:00:00Z",
            a: { r: "/exn/ipex/grant", d: "conn-123", m: "Credential message" },
            connectionId: "conn-123",
            read: false,
            groupReplied: false,
            receivingPre: "profile",
          },
          expectedBody: "Credential offer",
        },
        {
          name: "unknown",
          notification: {
            id: "test-unknown",
            createdAt: "2025-01-01T10:00:00Z",
            a: { r: "/unknown/type", d: "conn-123", m: "Unknown message" },
            connectionId: "conn-123",
            read: false,
            groupReplied: false,
            receivingPre: "profile",
          },
          expectedBody: "New notification",
        },
      ];

      for (const testCase of testCases) {
        (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
          notifications: [],
        });

        await notificationService.showLocalNotification(
          testCase.notification,
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
        expect(scheduledNotification.body).toBe(testCase.expectedBody);
        expect(scheduledNotification.actionTypeId).toBe("default");

        (LocalNotifications.schedule as jest.Mock).mockClear();
      }
    });
  });

  describe("notification tap handling", () => {
    let mockNavigator: jest.Mock;
    let mockProfileSwitcher: jest.Mock;

    beforeEach(() => {
      mockNavigator = jest.fn();
      mockProfileSwitcher = jest.fn();
      notificationService.setNavigator(mockNavigator);
      notificationService.setProfileSwitcher(mockProfileSwitcher);

      Object.defineProperty(window, "location", {
        value: { hash: "" },
        writable: true,
      });
    });

    test("should navigate to notifications when notification is tapped", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          route: "/credentials",
        },
      };

      (notificationService as any).debouncedProcessNotificationTap(
        notification
      );

      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(500);

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications", "1");

      jest.useRealTimers();
    });

    test("should navigate to notifications when no route specified", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {},
      };

      (notificationService as any).debouncedProcessNotificationTap(
        notification
      );

      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(500);

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications", "1");

      jest.useRealTimers();
    });

    test("should process notification tap immediately", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          profileId: "test-profile",
        },
      };

      (notificationService as any).debouncedProcessNotificationTap(
        notification
      );
      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(500);

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications", "1");

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
      (
        LocalNotifications.getDeliveredNotifications as jest.Mock
      ).mockResolvedValue({
        notifications: [],
      });
      (LocalNotifications.cancel as jest.Mock).mockResolvedValue(undefined);
    });

    test("should detect cold start state", () => {
      (notificationService as any).coldStartState = "PROCESSING";
      expect(notificationService.hasPendingColdStart()).toBe(true);
    });

    test("should return false when not in cold start", () => {
      (notificationService as any).coldStartState = "IDLE";
      expect(notificationService.hasPendingColdStart()).toBe(false);
    });

    test("should store target profile during notification tap", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          profileId: "profile-123",
          notificationId: "notif-1",
        },
      };

      (notificationService as any).navigator = null;
      (notificationService as any).profileSwitcher = null;

      (notificationService as any).processNotificationTap(
        notification,
        false,
        false
      );

      const stored = notificationService.getTargetProfileIdForColdStart();
      expect(stored).toBe("profile-123");
      const pending = (notificationService as any).pendingColdStartNotification;
      expect(pending).toEqual({
        profileId: "profile-123",
        notificationId: "1",
      });

      jest.useRealTimers();
    });

    test("should clear target profile after use", () => {
      (notificationService as any).targetProfileIdForColdStart = "profile-123";
      notificationService.clearTargetProfileIdForColdStart();

      const stored = notificationService.getTargetProfileIdForColdStart();
      expect(stored).toBeNull();
    });

    test("should enter processing state and complete on signal", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          profileId: "profile-123",
          notificationId: "notif-1",
        },
      };

      (notificationService as any).navigator = null;
      (notificationService as any).profileSwitcher = null;

      (notificationService as any).debouncedProcessNotificationTap(
        notification
      );

      jest.advanceTimersByTime(100);

      expect(notificationService.hasPendingColdStart()).toBe(true);

      notificationService.setProfileSwitcher(mockProfileSwitcher);
      notificationService.setNavigator(mockNavigator);

      notificationService.completeColdStart();

      expect(notificationService.hasPendingColdStart()).toBe(false);

      jest.useRealTimers();
    });

    test("should trigger cold start processing when app state changes", () => {
      jest.useFakeTimers();

      (notificationService as any).coldStartState = "PROCESSING";
      (notificationService as any).pendingColdStartNotification = {
        profileId: "profile-123",
        notificationId: "notif-1",
      };

      (notificationService as any).processPendingColdStartNotification();

      expect(mockProfileSwitcher).toHaveBeenCalledWith("profile-123");

      jest.advanceTimersByTime(1000);

      expect(mockNavigator).toHaveBeenCalledWith(
        "/tabs/notifications",
        "notif-1"
      );

      jest.useRealTimers();
    });

    test("should not process when no pending cold start", () => {
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

    test("should mark notification as shown", async () => {
      const notificationId = "test-notification-1";

      let savedNotifications: string[] = [];
      mockBasicStorage.createOrUpdateBasicRecord.mockImplementation(
        async (record: any) => {
          savedNotifications = record.content.notificationIds;
        }
      );

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

    test("should return false for notifications not yet shown", async () => {
      const notificationId = "not-shown-notification";

      mockBasicStorage.findById.mockResolvedValue(null);

      const isShown = await notificationService.isNotificationShown(
        notificationId
      );
      expect(isShown).toBe(false);
    });

    test("should cleanup old shown notifications", async () => {
      let savedNotifications: string[] = [];
      mockBasicStorage.createOrUpdateBasicRecord.mockImplementation(
        async (record: any) => {
          savedNotifications = record.content.notificationIds;
        }
      );

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

      mockBasicStorage.createOrUpdateBasicRecord.mockImplementation(
        async (record: any) => {
          savedNotifications = record.content.notificationIds;
          return record;
        }
      );

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

    test("should switch profiles when tapping notification from different profile", async () => {
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

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications", "1");

      jest.useRealTimers();
    });
  });

  describe("warm app profile switch", () => {
    let mockProfileSwitcher: jest.Mock;
    let mockNavigator: jest.Mock;

    beforeEach(() => {
      mockProfileSwitcher = jest.fn();
      mockNavigator = jest.fn();
      notificationService.setProfileSwitcher(mockProfileSwitcher);
      notificationService.setNavigator(mockNavigator);
      (notificationService as any).profileSwitchInProgress = false;
    });

    test("should detect profile switch in progress", () => {
      (notificationService as any).profileSwitchInProgress = true;
      expect(notificationService.isProfileSwitchInProgress()).toBe(true);
    });

    test("should return false when no profile switch", () => {
      (notificationService as any).profileSwitchInProgress = false;
      expect(notificationService.isProfileSwitchInProgress()).toBe(false);
    });

    test("should set profile switch complete", () => {
      (notificationService as any).profileSwitchInProgress = true;
      (notificationService as any).warmTargetProfileId = "profile-bob";
      notificationService.setProfileSwitchComplete();
      expect(notificationService.isProfileSwitchInProgress()).toBe(false);
      expect(notificationService.getTargetProfileIdForWarmSwitch()).toBeNull();
    });

    test("should set profile switch in progress when processing tap", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          profileId: "profile-bob",
          notificationId: "notif-1",
        },
      };

      (notificationService as any).processNotificationTap(notification);

      expect(notificationService.isProfileSwitchInProgress()).toBe(true);
      expect(notificationService.getTargetProfileIdForWarmSwitch()).toBe(
        "profile-bob"
      );

      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(500);

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications", "1");

      notificationService.setProfileSwitchComplete();
      expect(notificationService.isProfileSwitchInProgress()).toBe(false);
      expect(notificationService.getTargetProfileIdForWarmSwitch()).toBeNull();

      jest.useRealTimers();
    });

    test("should batch notifications after profile switch", async () => {
      jest.useFakeTimers();

      const notification = {
        id: 1,
        extra: {
          profileId: "profile-bob",
          notificationId: "notif-1",
        },
      };

      (notificationService as any).processNotificationTap(notification);

      expect(notificationService.isProfileSwitchInProgress()).toBe(true);

      jest.advanceTimersByTime(500);

      notificationService.setProfileSwitchComplete();

      expect(notificationService.isProfileSwitchInProgress()).toBe(false);

      jest.useRealTimers();
    });
  });
});
