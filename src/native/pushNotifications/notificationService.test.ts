import { LocalNotifications } from "@capacitor/local-notifications";
import { notificationService } from "./notificationService";
import { TabsRoutePath } from "../../routes/paths";

jest.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    requestPermissions: jest.fn(() => Promise.resolve({ display: "granted" })),
    schedule: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
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

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    getPlatform: jest.fn(() => "web"),
  },
}));

jest.mock("../../ui/utils/error", () => ({
  showError: jest.fn(),
}));

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notificationService as any).permissionsGranted = true;
    (notificationService as any).profileSwitcher = null;
  });

  describe("requestPermissions", () => {
    test("should request and grant permissions successfully", async () => {
      const mockResult = { display: "granted" };
      (LocalNotifications.requestPermissions as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await notificationService.requestPermissions();

      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
      expect(result).toBe(true);
      expect((notificationService as any).permissionsGranted).toBe(true);
    });

    test("should handle permission denied", async () => {
      const mockResult = { display: "denied" };
      (LocalNotifications.requestPermissions as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await notificationService.requestPermissions();

      expect(result).toBe(false);
      expect((notificationService as any).permissionsGranted).toBe(false);
    });
  });

  describe("schedulePushNotification", () => {
    test("should schedule notification with correct parameters", async () => {
      (notificationService as any).permissionsGranted = true;
      (LocalNotifications.schedule as jest.Mock).mockResolvedValue(undefined);

      const payload = {
        title: "Test Title",
        body: "Test Body",
        profileId: "profile-123",
        notificationId: "abcd1234",
      };

      await notificationService.schedulePushNotification(payload);

      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            title: "Test Title",
            body: "Test Body",
            actionTypeId: "default",
            extra: expect.objectContaining({
              profileId: "profile-123",
              notificationId: "abcd1234",
            }),
            channelId: "veridian-notifications",
          }),
        ],
      });
    });

    test("should request permissions if not granted", async () => {
      (notificationService as any).permissionsGranted = false;
      (LocalNotifications.requestPermissions as jest.Mock).mockResolvedValue({
        display: "granted",
      });
      (LocalNotifications.schedule as jest.Mock).mockResolvedValue(undefined);

      const payload = {
        title: "Test",
        body: "Body",
        profileId: "profile-123",
        notificationId: "xyz789",
      };

      await notificationService.schedulePushNotification(payload);

      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
      expect(LocalNotifications.schedule).toHaveBeenCalled();
    });

    test("should throw error if permissions denied", async () => {
      (notificationService as any).permissionsGranted = false;
      (LocalNotifications.requestPermissions as jest.Mock).mockResolvedValue({
        display: "denied",
      });

      const payload = {
        title: "Test",
        body: "Body",
        profileId: "profile-123",
        notificationId: "xyz789",
      };

      await expect(
        notificationService.schedulePushNotification(payload)
      ).rejects.toThrow("Notification permissions not granted");

      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    test("should convert notification ID to integer for scheduling", async () => {
      (notificationService as any).permissionsGranted = true;
      (LocalNotifications.schedule as jest.Mock).mockResolvedValue(undefined);

      const payload = {
        title: "Test",
        body: "Body",
        profileId: "profile-123",
        notificationId: "00000001",
      };

      await notificationService.schedulePushNotification(payload);

      const scheduleCall = (LocalNotifications.schedule as jest.Mock).mock
        .calls[0][0];
      expect(typeof scheduleCall.notifications[0].id).toBe("number");
      expect(scheduleCall.notifications[0].id).toBeGreaterThan(0);
    });
  });

  describe("handleNotificationTap", () => {
    let mockProfileSwitcher: jest.Mock;
    let mockPushState: jest.SpyInstance;
    let mockDispatchEvent: jest.SpyInstance;

    beforeEach(() => {
      mockProfileSwitcher = jest.fn();
      mockPushState = jest.spyOn(window.history, "pushState");
      mockDispatchEvent = jest.spyOn(window, "dispatchEvent");
      (notificationService as any).profileSwitcher = mockProfileSwitcher;
    });

    afterEach(() => {
      mockPushState.mockRestore();
      mockDispatchEvent.mockRestore();
    });

    test("should switch profile and navigate on tap", async () => {
      const notification = {
        id: 1,
        extra: {
          profile: "profile-abc",
          profileId: "profile-abc",
          notificationId: "notif-123",
        },
      };

      await (notificationService as any).handleNotificationTap(notification);

      expect(mockProfileSwitcher).toHaveBeenCalledWith("profile-abc");
      expect(mockPushState).toHaveBeenCalledWith(
        null,
        "",
        TabsRoutePath.NOTIFICATIONS
      );
      expect(mockDispatchEvent).toHaveBeenCalled();
    });

    test("should queue notification if profileSwitcher not set", async () => {
      (notificationService as any).profileSwitcher = null;

      const notification = {
        id: 1,
        extra: {
          profile: "profile-abc",
          profileId: "profile-abc",
          notificationId: "notif-123",
        },
      };

      await (notificationService as any).handleNotificationTap(notification);

      expect((notificationService as any).pendingNotification).toEqual(
        notification
      );
      expect(mockPushState).not.toHaveBeenCalled();
      expect(mockDispatchEvent).not.toHaveBeenCalled();
    });

    test("should queue notification if profileSwitcher not set", async () => {
      const notification = {
        id: 1,
        extra: {
          profile: "profile-abc",
          profileId: "profile-abc",
          notificationId: "notif-123",
        },
      };

      await (notificationService as any).handleNotificationTap(notification);

      expect((notificationService as any).pendingNotification).toEqual(
        notification
      );
    });
  });

  describe("arePermissionsGranted", () => {
    test("should return true when permissions granted", async () => {
      (LocalNotifications.checkPermissions as jest.Mock).mockResolvedValue({
        display: "granted",
      });

      const result = await notificationService.arePermissionsGranted();

      expect(result).toBe(true);
      expect((notificationService as any).permissionsGranted).toBe(true);
    });

    test("should return false when permissions denied", async () => {
      (LocalNotifications.checkPermissions as jest.Mock).mockResolvedValue({
        display: "denied",
      });

      const result = await notificationService.arePermissionsGranted();

      expect(result).toBe(false);
      expect((notificationService as any).permissionsGranted).toBe(false);
    });
  });

  describe("setProfileSwitcher", () => {
    test("should set profile switcher callback", () => {
      const mockCallback = jest.fn();
      notificationService.setProfileSwitcher(mockCallback);
      expect((notificationService as any).profileSwitcher).toBe(mockCallback);
    });

    test("should process pending notification when profile switcher is set", async () => {
      const notification = {
        id: 1,
        extra: {
          profile: "profile-abc",
          profileId: "profile-abc",
          notificationId: "notif-123",
        },
      };

      (notificationService as any).profileSwitcher = null;
      await (notificationService as any).handleNotificationTap(notification);

      expect((notificationService as any).pendingNotification).toEqual(
        notification
      );

      const mockProfileSwitcher = jest.fn();
      const mockPushState = jest.spyOn(window.history, "pushState");
      const mockDispatchEvent = jest.spyOn(window, "dispatchEvent");

      notificationService.setProfileSwitcher(mockProfileSwitcher);

      await (notificationService as any).processPendingNotification();

      expect((notificationService as any).pendingNotification).toBeNull();
      expect(mockProfileSwitcher).toHaveBeenCalledWith("profile-abc");
      expect(mockPushState).toHaveBeenCalledWith(
        null,
        "",
        TabsRoutePath.NOTIFICATIONS
      );
      expect(mockDispatchEvent).toHaveBeenCalled();

      mockPushState.mockRestore();
      mockDispatchEvent.mockRestore();
    });
  });
});
