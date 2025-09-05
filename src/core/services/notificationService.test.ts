import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import {
  notificationService,
  NotificationService,
} from "./notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";

// Mock Capacitor plugins
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
  },
}));

// Mock React Router
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

describe("NotificationService", () => {
  let mockHistory: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHistory = {
      push: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
      length: 1,
      action: "PUSH",
      location: { pathname: "/", search: "", hash: "", state: null },
    };

    // Reset the singleton instance
    (notificationService as any).history = null;
    notificationService.setHistory(mockHistory);
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
    it("should schedule a notification successfully", async () => {
      const payload = {
        notificationId: "1",
        profileId: "profile-123",
        type: "general" as const,
        title: "Test Notification",
        body: "Test body",
        route: "/test",
      };

      (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
        notifications: [payload],
      });

      await notificationService.scheduleNotification(payload);

      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          {
            id: 1,
            title: "Test Notification",
            body: "Test body",
            schedule: { at: expect.any(Date) },
            extra: {
              profileId: "profile-123",
              type: "general",
              route: "/test",
            },
          },
        ],
      });
    });

    it("should handle scheduling errors", async () => {
      const payload = {
        notificationId: "1",
        profileId: "profile-123",
        type: "general" as const,
        title: "Test Notification",
        body: "Test body",
      };

      const error = new Error("Scheduling error");
      (LocalNotifications.schedule as jest.Mock).mockRejectedValue(error);

      // Should not throw, just log error
      await expect(
        notificationService.scheduleNotification(payload)
      ).resolves.toBeUndefined();
    });
  });

  describe("showLocalNotification", () => {
    it("should show local notification for KERIA notification", async () => {
      const keriaNotification: KeriaNotification = {
        id: "test",
        createdAt: "2025-01-01T10:00:00Z",
        a: { r: "/multisig/icp" },
        connectionId: "conn-123",
        read: false,
        groupReplied: false,
        receivingPre: "profile",
      };

      (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
        notifications: [],
      });

      await notificationService.showLocalNotification(keriaNotification);

      expect(LocalNotifications.schedule).toHaveBeenCalled();
    });
  });

  describe("clearDeliveredNotifications", () => {
    it("should clear all delivered notifications", async () => {
      (
        LocalNotifications.removeAllDeliveredNotifications as jest.Mock
      ).mockResolvedValue({});

      await notificationService.clearDeliveredNotifications();

      expect(
        LocalNotifications.removeAllDeliveredNotifications
      ).toHaveBeenCalled();
    });

    it("should handle clear errors", async () => {
      const error = new Error("Clear error");
      (
        LocalNotifications.removeAllDeliveredNotifications as jest.Mock
      ).mockRejectedValue(error);

      // Should not throw, just log error
      await expect(
        notificationService.clearDeliveredNotifications()
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

      // Should not throw, just log error
      await expect(
        notificationService.cancelNotification("1")
      ).resolves.toBeUndefined();
    });
  });

  describe("setHistory", () => {
    it("should set the history object", () => {
      const newHistory = {
        push: jest.fn(),
        replace: jest.fn(),
        goBack: jest.fn(),
        go: jest.fn(),
        goForward: jest.fn(),
        block: jest.fn(),
        listen: jest.fn(),
        createHref: jest.fn(),
        length: 1,
        action: "PUSH" as const,
        location: { pathname: "/", search: "", hash: "", state: null },
      };
      notificationService.setHistory(newHistory);

      expect((notificationService as any).history).toBe(newHistory);
    });
  });

  describe("private methods via showLocalNotification", () => {
    it("should map multisig notifications correctly", async () => {
      const notification: KeriaNotification = {
        id: "test",
        createdAt: "2025-01-01T10:00:00Z",
        a: { r: "/multisig/icp" },
        connectionId: "conn-123",
        read: false,
        groupReplied: false,
        receivingPre: "profile",
      };

      (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
        notifications: [],
      });

      await notificationService.showLocalNotification(notification);

      const scheduleCall = (LocalNotifications.schedule as jest.Mock).mock
        .calls[0][0];
      const scheduledNotification = scheduleCall.notifications[0];

      expect(scheduledNotification.title).toBe("Cardano Foundation");
      expect(scheduledNotification.extra.type).toBe("multisig");
      expect(scheduledNotification.extra.route).toBe("/tabs/credentials");
    });

    it("should map credential notifications correctly", async () => {
      const notification: KeriaNotification = {
        id: "test",
        createdAt: "2025-01-01T10:00:00Z",
        a: { r: "/credential/iss" },
        connectionId: "conn-123",
        read: false,
        groupReplied: false,
        receivingPre: "profile",
      };

      (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
        notifications: [],
      });

      await notificationService.showLocalNotification(notification);

      const scheduleCall = (LocalNotifications.schedule as jest.Mock).mock
        .calls[0][0];
      const scheduledNotification = scheduleCall.notifications[0];

      expect(scheduledNotification.title).toBe("Cardano Foundation");
      expect(scheduledNotification.extra.type).toBe("credential");
      expect(scheduledNotification.extra.route).toBe("/tabs/credentials");
    });

    it("should handle unknown notification types", async () => {
      const notification: KeriaNotification = {
        id: "test",
        createdAt: "2025-01-01T10:00:00Z",
        a: { r: "/unknown/type" },
        connectionId: "conn-123",
        read: false,
        groupReplied: false,
        receivingPre: "profile",
      };

      (LocalNotifications.schedule as jest.Mock).mockResolvedValue({
        notifications: [],
      });

      await notificationService.showLocalNotification(notification);

      const scheduleCall = (LocalNotifications.schedule as jest.Mock).mock
        .calls[0][0];
      const scheduledNotification = scheduleCall.notifications[0];

      expect(scheduledNotification.title).toBe("Cardano Foundation");
      expect(scheduledNotification.extra.type).toBe("connection");
      expect(scheduledNotification.extra.route).toBe("/tabs/connections");
    });
  });

  describe("notification tap handling", () => {
    it("should navigate to specified route when notification is tapped", () => {
      const notification = {
        id: 1,
        extra: {
          route: "/credentials",
        },
      };

      // Access private method for testing
      (notificationService as any).handleNotificationTap(notification);

      expect(mockHistory.push).toHaveBeenCalledWith("/credentials");
    });

    it("should navigate to notifications when no route specified", () => {
      const notification = {
        id: 1,
        extra: {},
      };

      (notificationService as any).handleNotificationTap(notification);

      expect(mockHistory.push).toHaveBeenCalledWith("/tabs/notifications");
    });

    it("should not navigate if no history set", () => {
      (notificationService as any).history = null;

      const notification = {
        id: 1,
        extra: { route: "/test" },
      };

      (notificationService as any).handleNotificationTap(notification);

      expect(mockHistory.push).not.toHaveBeenCalled();
    });
  });
});
