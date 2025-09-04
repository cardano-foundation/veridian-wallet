import { renderHook, act } from "@testing-library/react";
import { useLocalNotifications } from "./useLocalNotifications";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";

// Mock React Redux
jest.mock("../../store/hooks", () => ({
  useAppSelector: jest.fn(),
}));

// Mock notification service
jest.mock("../../core/services/notificationService", () => ({
  useNotificationService: jest.fn(),
}));

// Import the mocked functions
import { useAppSelector } from "../../store/hooks";
import { useNotificationService } from "../../core/services/notificationService";

const mockUseAppSelector = useAppSelector as jest.MockedFunction<
  typeof useAppSelector
>;
const mockUseNotificationService =
  useNotificationService as jest.MockedFunction<typeof useNotificationService>;

describe("useLocalNotifications", () => {
  const mockShowLocalNotification = jest.fn();
  const mockRequestPermissions = jest.fn();

  const mockNotificationService = {
    showLocalNotification: mockShowLocalNotification,
    requestPermissions: mockRequestPermissions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppSelector.mockReturnValue([]);

    // Mock only the methods we actually use
    mockUseNotificationService.mockReturnValue({
      showLocalNotification: mockShowLocalNotification,
      requestPermissions: mockRequestPermissions,
    } as any);
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

    expect(mockShowLocalNotification).toHaveBeenCalledWith(mockNotification);
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

    mockUseAppSelector.mockReturnValue(mockNotifications);

    renderHook(() => useLocalNotifications());

    // Should only show the unread notification
    expect(mockShowLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockShowLocalNotification).toHaveBeenCalledWith(
      mockNotifications[1]
    );
  });

  it("should handle empty notifications array", () => {
    mockUseAppSelector.mockReturnValue([]);

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
