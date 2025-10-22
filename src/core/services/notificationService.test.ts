import { LocalNotifications } from "@capacitor/local-notifications";
import { notificationService } from "./notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";

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
  beforeEach(() => {
    jest.clearAllMocks();
    (notificationService as any).history = null;
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
            actionTypeId: "default",
            extra: {
              profileId: "profile-123",
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

      await notificationService.showLocalNotification(
        keriaNotification,
        "",
        "Test Profile"
      );

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

      await notificationService.showLocalNotification(
        notification,
        "",
        "Test Profile"
      );

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
        a: { r: "/credential/iss" },
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
        "",
        "Test Profile"
      );

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
        a: { r: "/unknown/type" },
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
        "",
        "Test Profile"
      );

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
      const notification = {
        id: 1,
        extra: {
          route: "/credentials",
        },
      };

      (notificationService as any).handleNotificationTap(notification);

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications");
    });

    it("should navigate to notifications when no route specified", async () => {
      const notification = {
        id: 1,
        extra: {},
      };

      (notificationService as any).handleNotificationTap(notification);

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications");
    });

    it("should process notification tap immediately", async () => {
      const notification = {
        id: 1,
        extra: {
          profileId: "test-profile",
        },
      };

      (notificationService as any).handleNotificationTap(notification);

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(mockNavigator).toHaveBeenCalledWith("/tabs/notifications");
    });
  });
});
