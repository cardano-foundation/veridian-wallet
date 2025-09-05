import { renderHook, act } from "@testing-library/react";
import { useLocalNotifications } from "./useLocalNotifications";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";

// Mock React Redux
jest.mock("../../store/hooks", () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}));

// Mock notification service
jest.mock("../../core/services/notificationService", () => ({
  notificationService: {
    showLocalNotification: jest.fn(),
    requestPermissions: jest.fn(),
    setProfileSwitcher: jest.fn(),
  },
}));

// Import the mocked functions
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { notificationService } from "../../core/services/notificationService";
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAppSelector to return different values based on the selector
    mockUseAppSelector.mockImplementation((selector) => {
      if (selector === getNotificationsCache) {
        return [];
      }
      if (selector === getCurrentProfile) {
        return { identity: { id: "test-profile-id" } };
      }
      if (selector === getProfiles) {
        return {};
      }
      return undefined;
    });

    // Mock useAppDispatch
    mockUseAppDispatch.mockReturnValue(jest.fn());

    // Mock only the methods we actually use
    mockNotificationService.showLocalNotification = mockShowLocalNotification;
    mockNotificationService.requestPermissions = mockRequestPermissions;
  });

  it("should return showNotification and requestPermissions functions", () => {
    const { result } = renderHook(() => useLocalNotifications());

    expect(result.current.showNotification).toBeDefined();
    expect(typeof result.current.showNotification).toBe("function");
    expect(result.current.requestPermissions).toBeDefined();
    expect(typeof result.current.requestPermissions).toBe("function");
  });

  it("should call notificationService.showLocalNotification when showNotification is called", () => {
    const { result } = renderHook(() => useLocalNotifications());

    const mockNotification: KeriaNotification = {
      id: "test-notification-id",
      createdAt: "2024-01-01T00:00:00Z",
      read: true,
      a: {
        r: "/notification/route",
        m: "Test notification message",
      },
      connectionId: "test-connection-id",
      groupReplied: false,
      receivingPre: "test-receiving-pre",
    };

    act(() => {
      result.current.showNotification(mockNotification);
    });

    expect(mockShowLocalNotification).toHaveBeenCalledWith(
      mockNotification,
      "test-profile-id"
    );
    expect(mockShowLocalNotification).toHaveBeenCalledTimes(1);
  });

  it("should call notificationService.requestPermissions when requestPermissions is called", async () => {
    const { result } = renderHook(() => useLocalNotifications());

    mockRequestPermissions.mockResolvedValue(true);

    let permissionsGranted;
    await act(async () => {
      permissionsGranted = await result.current.requestPermissions();
    });

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(permissionsGranted).toBe(true);
  });

  it("should show notifications for unread notifications on mount", () => {
    const mockNotifications: KeriaNotification[] = [
      {
        id: "read-notification",
        createdAt: "2024-01-01T00:00:00Z",
        read: true, // read: true
        a: {
          r: "/notification/route1",
          m: "Read notification",
        },
        connectionId: "test-connection-id-1",
        groupReplied: false,
        receivingPre: "test-receiving-pre",
      },
      {
        id: "unread-notification",
        createdAt: "2024-01-01T00:00:00Z",
        read: false, // read: false
        a: {
          r: "/notification/route2",
          m: "Unread notification",
        },
        connectionId: "test-connection-id-2",
        groupReplied: false,
        receivingPre: "test-receiving-pre",
      },
    ];

    const mockProfiles = {
      "test-profile-id": {
        notifications: mockNotifications,
      },
    };

    // Mock useAppSelector to return profiles with notifications
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

    // Should only show the unread notification
    expect(mockShowLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockShowLocalNotification).toHaveBeenCalledWith(
      mockNotifications[1],
      "test-profile-id"
    );
  });

  it("should handle empty notifications array", () => {
    const mockProfiles = {
      "test-profile-id": {
        notifications: [],
      },
    };

    // Mock useAppSelector to return profiles with empty notifications
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

  it("should handle requestPermissions errors gracefully", async () => {
    const { result } = renderHook(() => useLocalNotifications());

    const testError = new Error("Permission denied");
    mockRequestPermissions.mockRejectedValue(testError);

    await expect(result.current.requestPermissions()).rejects.toThrow(
      "Permission denied"
    );
    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
  });
});
