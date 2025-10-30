import { renderHook, act } from "@testing-library/react";
import { useLocalNotifications } from "./useLocalNotifications";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";

jest.mock("../../store/hooks", () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}));

jest.mock("../../native/pushNotifications/notificationService", () => ({
  notificationService: {
    showLocalNotification: jest.fn(),
    requestPermissions: jest.fn(),
    setProfileSwitcher: jest.fn(),
    setNavigator: jest.fn(),
    hasPendingColdStart: jest.fn(),
    isNotificationShown: jest.fn(),
    markAsShown: jest.fn(),
    cleanupShownNotifications: jest.fn(),
    isProfileSwitchInProgress: jest.fn(),
    getTargetProfileIdForWarmSwitch: jest.fn(),
    getTargetProfileIdForColdStart: jest.fn(),
    setProfileSwitchComplete: jest.fn(),
  },
}));

import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { notificationService } from "../../native/pushNotifications/notificationService";
import {
  getNotificationsCache,
  getCurrentProfile,
  getProfiles,
} from "../../store/reducers/profileCache";

const mockUseAppSelector = useAppSelector as jest.MockedFunction<
  typeof useAppSelector
>;
const mockUseAppDispatch = useAppDispatch as jest.MockedFunction<
  typeof useAppDispatch
>;
const mockNotificationService = notificationService as jest.Mocked<
  typeof notificationService
>;

describe("useLocalNotifications", () => {
  const mockShowLocalNotification = jest.fn();
  const mockRequestPermissions = jest.fn();
  const mockHasPendingColdStart = jest.fn();
  const mockIsNotificationShown = jest.fn();
  const mockMarkAsShown = jest.fn();
  const mockCleanupShownNotifications = jest.fn();
  const mockIsProfileSwitchInProgress = jest.fn();
  const mockGetTargetProfileIdForWarmSwitch = jest.fn();
  const mockGetTargetProfileIdForColdStart = jest.fn();
  const mockSetProfileSwitchComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAppSelector.mockImplementation((selector) => {
      if (selector === getNotificationsCache) {
        return [];
      }
      if (selector === getCurrentProfile) {
        return { identity: { id: "test-profile-id" } };
      }
      if (selector === getProfiles) {
        return {
          "test-profile": {
            identity: {
              id: "test-receiving-pre",
              displayName: "Test Profile",
            },
          },
        };
      }
      return undefined;
    });

    mockUseAppDispatch.mockReturnValue(jest.fn());
    mockNotificationService.showLocalNotification = mockShowLocalNotification;
    mockNotificationService.requestPermissions = mockRequestPermissions;
    mockNotificationService.hasPendingColdStart = mockHasPendingColdStart;
    mockNotificationService.isNotificationShown = mockIsNotificationShown;
    mockNotificationService.markAsShown = mockMarkAsShown;
    mockNotificationService.cleanupShownNotifications =
      mockCleanupShownNotifications;
    mockNotificationService.isProfileSwitchInProgress =
      mockIsProfileSwitchInProgress;
    mockNotificationService.getTargetProfileIdForWarmSwitch =
      mockGetTargetProfileIdForWarmSwitch;
    mockNotificationService.getTargetProfileIdForColdStart =
      mockGetTargetProfileIdForColdStart;
    mockNotificationService.setProfileSwitchComplete =
      mockSetProfileSwitchComplete;

    mockHasPendingColdStart.mockReturnValue(false);
    mockIsNotificationShown.mockResolvedValue(false);
    mockIsProfileSwitchInProgress.mockReturnValue(false);
    mockGetTargetProfileIdForWarmSwitch.mockReturnValue(undefined);
    mockGetTargetProfileIdForColdStart.mockReturnValue(undefined);
    mockSetProfileSwitchComplete.mockReturnValue(undefined);
  });

  test("should set up notification service callbacks", () => {
    const mockDispatch = jest.fn();
    mockUseAppDispatch.mockReturnValue(mockDispatch);

    renderHook(() => useLocalNotifications());

    expect(mockNotificationService.setProfileSwitcher).toHaveBeenCalledWith(
      expect.any(Function)
    );
    expect(mockNotificationService.setNavigator).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  test("should show notifications for unread notifications from other profiles", async () => {
    const mockNotifications: KeriaNotification[] = [
      {
        id: "read-notification",
        createdAt: "2024-01-01T00:00:00Z",
        read: true,
        a: {
          r: "/notification/route1",
          m: "Read notification",
        },
        connectionId: "test-connection-id-1",
        groupReplied: false,
        receivingPre: "other-profile",
      },
      {
        id: "unread-notification",
        createdAt: "2024-01-01T00:00:00Z",
        read: false,
        a: {
          r: "/notification/route2",
          m: "Unread notification",
        },
        connectionId: "test-connection-id-2",
        groupReplied: false,
        receivingPre: "other-profile",
      },
    ];

    const mockProfiles = {
      "test-profile-id": {
        identity: {
          id: "test-profile-id",
          displayName: "Current Profile",
        },
        notifications: [],
      },
      "other-profile": {
        identity: {
          id: "other-profile",
          displayName: "Other Profile",
        },
        notifications: mockNotifications,
      },
    };

    mockUseAppSelector.mockImplementation((selector) => {
      if (selector === getProfiles) {
        return mockProfiles;
      }
      if (selector === getCurrentProfile) {
        return { identity: { id: "test-profile-id" } };
      }
      return undefined;
    });

    renderHook(() => useLocalNotifications());

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(mockShowLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockShowLocalNotification).toHaveBeenCalledWith(
      mockNotifications[1],
      "test-profile-id",
      "Other Profile",
      expect.any(Object)
    );
  });

  test("should handle empty notifications array", () => {
    const mockProfiles = {
      "test-profile-id": {
        notifications: [],
      },
    };

    mockUseAppSelector.mockImplementation((selector) => {
      if (selector === getProfiles) {
        return mockProfiles;
      }
      if (selector === getCurrentProfile) {
        return { identity: { id: "test-profile-id" } };
      }
      return undefined;
    });

    renderHook(() => useLocalNotifications());

    expect(mockShowLocalNotification).not.toHaveBeenCalled();
  });

  describe("cold start handling", () => {
    test("should skip notification processing during cold start", async () => {
      mockHasPendingColdStart.mockReturnValue(true);

      const mockProfiles = {
        "profile-1": {
          identity: { id: "profile-1", displayName: "Alice" },
          notifications: [
            {
              id: "notif-1",
              createdAt: "2024-01-01T00:00:00Z",
              read: false,
              a: { r: "/multisig/icp" },
              connectionId: "conn-1",
              groupReplied: false,
              receivingPre: "profile-2",
            },
          ],
        },
        "profile-2": {
          identity: { id: "profile-2", displayName: "Bob" },
          notifications: [],
        },
      };

      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === getProfiles) return mockProfiles;
        if (selector === getCurrentProfile)
          return { identity: { id: "profile-1" } };
        return undefined;
      });

      renderHook(() => useLocalNotifications());

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockShowLocalNotification).not.toHaveBeenCalled();
    });

    test("should process notifications after cold start completes", async () => {
      mockHasPendingColdStart.mockReturnValue(false);

      const mockProfiles = {
        "profile-1": {
          identity: { id: "profile-1", displayName: "Alice" },
          notifications: [],
        },
        "profile-2": {
          identity: { id: "profile-2", displayName: "Bob" },
          notifications: [
            {
              id: "notif-2",
              createdAt: "2024-01-01T00:00:00Z",
              read: false,
              a: { r: "/credential/iss" },
              connectionId: "conn-2",
              groupReplied: false,
              receivingPre: "profile-2",
            },
          ],
        },
      };

      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === getProfiles) return mockProfiles;
        if (selector === getCurrentProfile)
          return { identity: { id: "profile-1" } };
        return undefined;
      });

      renderHook(() => useLocalNotifications());

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockShowLocalNotification).toHaveBeenCalled();
    });
  });

  describe("notification tracking", () => {
    test("should mark current profile notifications as shown", async () => {
      const mockProfiles = {
        "profile-1": {
          identity: { id: "profile-1", displayName: "Alice" },
          notifications: [
            {
              id: "notif-1",
              createdAt: "2024-01-01T00:00:00Z",
              read: false,
              a: { r: "/multisig/icp" },
              connectionId: "conn-1",
              groupReplied: false,
              receivingPre: "profile-1",
            },
          ],
        },
      };

      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === getProfiles) return mockProfiles;
        if (selector === getCurrentProfile)
          return { identity: { id: "profile-1" } };
        return undefined;
      });

      renderHook(() => useLocalNotifications());

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockMarkAsShown).toHaveBeenCalledWith("notif-1");
    });

    test("should not display already shown notifications", async () => {
      mockIsNotificationShown.mockResolvedValue(true);

      const mockProfiles = {
        "profile-1": {
          identity: { id: "profile-1", displayName: "Alice" },
          notifications: [],
        },
        "profile-2": {
          identity: { id: "profile-2", displayName: "Bob" },
          notifications: [
            {
              id: "notif-2",
              createdAt: "2024-01-01T00:00:00Z",
              read: false,
              a: { r: "/credential/iss" },
              connectionId: "conn-2",
              groupReplied: false,
              receivingPre: "profile-2",
            },
          ],
        },
      };

      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === getProfiles) return mockProfiles;
        if (selector === getCurrentProfile)
          return { identity: { id: "profile-1" } };
        return undefined;
      });

      renderHook(() => useLocalNotifications());

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockShowLocalNotification).not.toHaveBeenCalled();
    });

    test("should cleanup old shown notifications", async () => {
      const mockProfiles = {
        "profile-1": {
          identity: { id: "profile-1", displayName: "Alice" },
          notifications: [
            {
              id: "notif-1",
              createdAt: "2024-01-01T00:00:00Z",
              read: false,
              a: { r: "/multisig/icp" },
              connectionId: "conn-1",
              groupReplied: false,
              receivingPre: "profile-1",
            },
          ],
        },
      };

      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === getProfiles) return mockProfiles;
        if (selector === getCurrentProfile)
          return { identity: { id: "profile-1" } };
        return undefined;
      });

      renderHook(() => useLocalNotifications());

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockCleanupShownNotifications).toHaveBeenCalled();
    });
  });

  describe("profile switching", () => {
    test("should process notifications when profile changes", async () => {
      const mockProfiles = {
        "profile-1": {
          identity: { id: "profile-1", displayName: "Alice" },
          notifications: [
            {
              id: "notif-1",
              createdAt: "2024-01-01T00:00:00Z",
              read: false,
              a: { r: "/multisig/icp" },
              connectionId: "conn-1",
              groupReplied: false,
              receivingPre: "profile-1",
            },
          ],
        },
        "profile-2": {
          identity: { id: "profile-2", displayName: "Bob" },
          notifications: [
            {
              id: "notif-2",
              createdAt: "2024-01-01T00:00:00Z",
              read: false,
              a: { r: "/credential/iss" },
              connectionId: "conn-2",
              groupReplied: false,
              receivingPre: "profile-2",
            },
          ],
        },
      };

      let currentProfile = { identity: { id: "profile-1" } };

      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === getProfiles) return mockProfiles;
        if (selector === getCurrentProfile) return currentProfile;
        return undefined;
      });

      const { rerender } = renderHook(() => useLocalNotifications());

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockShowLocalNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "notif-2",
          a: { r: "/credential/iss" },
        }),
        "profile-1",
        "Bob",
        expect.any(Object)
      );

      currentProfile = { identity: { id: "profile-2" } };
      rerender();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockShowLocalNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "notif-1",
          a: { r: "/multisig/icp" },
        }),
        "profile-2",
        "Alice",
        expect.any(Object)
      );
    });

    test("should process notifications from other profiles", async () => {
      const mockProfiles = {
        "profile-1": {
          identity: { id: "profile-1", displayName: "Alice" },
          notifications: [],
        },
        "profile-2": {
          identity: { id: "profile-2", displayName: "Bob" },
          notifications: [
            {
              id: "notif-2",
              createdAt: "2024-01-01T00:00:00Z",
              read: false,
              a: { r: "/credential/iss" },
              connectionId: "conn-2",
              groupReplied: false,
              receivingPre: "profile-2",
            },
          ],
        },
      };

      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === getProfiles) return mockProfiles;
        if (selector === getCurrentProfile)
          return { identity: { id: "profile-1" } };
        return undefined;
      });

      renderHook(() => useLocalNotifications());

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockShowLocalNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "notif-2",
          a: { r: "/credential/iss" },
        }),
        "profile-1",
        "Bob",
        expect.any(Object)
      );
    });
  });
});
