import { renderHook, act } from "@testing-library/react";
import { useNotificationManager } from "./useNotificationManager";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";

// Mock React Redux
jest.mock("../../store/hooks", () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}));

// Mock notification service
jest.mock("../../core/services/notificationService", () => ({
  useNotificationService: jest.fn(),
}));

// Mock background notifications hook
jest.mock("./useBackgroundNotifications", () => ({
  useBackgroundNotifications: jest.fn(),
}));

// Mock showError
jest.mock("../../ui/utils/error", () => ({
  showError: jest.fn(),
}));

// Import mocked functions
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { useNotificationService } from "../../core/services/notificationService";
import { useBackgroundNotifications } from "./useBackgroundNotifications";
import { showError } from "../../ui/utils/error";

const mockUseAppSelector = useAppSelector as jest.MockedFunction<
  typeof useAppSelector
>;
const mockUseAppDispatch = useAppDispatch as jest.MockedFunction<
  typeof useAppDispatch
>;
const mockUseNotificationService =
  useNotificationService as jest.MockedFunction<typeof useNotificationService>;
const mockUseBackgroundNotifications =
  useBackgroundNotifications as jest.MockedFunction<
    typeof useBackgroundNotifications
  >;
const mockShowError = showError as jest.MockedFunction<typeof showError>;

describe("useNotificationManager", () => {
  const mockDispatch = jest.fn();
  const mockShowLocalNotification = jest.fn();
  const mockRequestPermissions = jest.fn();
  const mockTriggerBackgroundCheck = jest.fn();
  const mockGetBackgroundStatus = jest.fn();

  const mockNotificationService = {
    showLocalNotification: mockShowLocalNotification,
    requestPermissions: mockRequestPermissions,
  };

  const mockBackgroundNotifications = {
    triggerBackgroundCheck: mockTriggerBackgroundCheck,
    getStatus: mockGetBackgroundStatus,
  };

  const mockCurrentProfile = {
    id: "test-profile-id",
    identity: {
      id: "test-identity-id",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppSelector.mockReturnValue(mockCurrentProfile);
    mockUseAppDispatch.mockReturnValue(mockDispatch);

    // Mock only the methods we actually use
    mockUseNotificationService.mockReturnValue({
      showLocalNotification: mockShowLocalNotification,
      requestPermissions: mockRequestPermissions,
    } as any);

    mockUseBackgroundNotifications.mockReturnValue(mockBackgroundNotifications);
    mockRequestPermissions.mockResolvedValue(true);
  });

  it("should initialize notification permissions on mount", () => {
    renderHook(() => useNotificationManager());

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
  });

  it("should show success message when permissions are granted", async () => {
    mockRequestPermissions.mockResolvedValue(true);

    renderHook(() => useNotificationManager());

    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async initialization

    expect(mockShowError).toHaveBeenCalledWith(
      "Notification permissions granted",
      null,
      mockDispatch
    );
  });

  it("should show error message when permissions are denied", async () => {
    mockRequestPermissions.mockResolvedValue(false);

    renderHook(() => useNotificationManager());

    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async initialization

    expect(mockShowError).toHaveBeenCalledWith(
      "Notification permissions denied",
      null,
      mockDispatch
    );
  });

  it("should handle permission initialization errors", async () => {
    const testError = new Error("Permission initialization failed");
    mockRequestPermissions.mockRejectedValue(testError);

    renderHook(() => useNotificationManager());

    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async initialization

    expect(mockShowError).toHaveBeenCalledWith(
      "Failed to initialize notifications",
      testError,
      mockDispatch
    );
  });

  it("should return expected functions", () => {
    const { result } = renderHook(() => useNotificationManager());

    expect(result.current.showProfileNotification).toBeDefined();
    expect(typeof result.current.showProfileNotification).toBe("function");
    expect(result.current.requestPermissions).toBeDefined();
    expect(typeof result.current.requestPermissions).toBe("function");
    expect(result.current.triggerBackgroundCheck).toBeDefined();
    expect(typeof result.current.triggerBackgroundCheck).toBe("function");
    expect(result.current.getBackgroundStatus).toBeDefined();
    expect(typeof result.current.getBackgroundStatus).toBe("function");
  });

  it("should show notification for current profile", () => {
    const { result } = renderHook(() => useNotificationManager());

    const mockNotification: KeriaNotification = {
      id: "test-notification-id",
      createdAt: "2024-01-01T00:00:00Z",
      read: false,
      a: {
        r: "/notification/route",
        m: "Test notification message",
      },
      connectionId: "test-connection-id",
      groupReplied: false,
      receivingPre: mockCurrentProfile.identity.id, // Matches current profile
    };

    act(() => {
      result.current.showProfileNotification(mockNotification);
    });

    expect(mockShowLocalNotification).toHaveBeenCalledWith(mockNotification);
  });

  it("should not show notification for different profile", () => {
    const { result } = renderHook(() => useNotificationManager());

    const mockNotification: KeriaNotification = {
      id: "test-notification-id",
      createdAt: "2024-01-01T00:00:00Z",
      read: false,
      a: {
        r: "/notification/route",
        m: "Test notification message",
      },
      connectionId: "test-connection-id",
      groupReplied: false,
      receivingPre: "different-profile-id", // Different from current profile
    };

    act(() => {
      result.current.showProfileNotification(mockNotification);
    });

    expect(mockShowLocalNotification).not.toHaveBeenCalled();
  });

  it("should call notificationService.requestPermissions when requestPermissions is called", async () => {
    const { result } = renderHook(() => useNotificationManager());

    mockRequestPermissions.mockResolvedValue(true);

    const granted = await result.current.requestPermissions();

    expect(mockRequestPermissions).toHaveBeenCalledTimes(2); // Once on mount, once manually
    expect(granted).toBe(true);
  });

  it("should call background triggerBackgroundCheck when triggerBackgroundCheck is called", async () => {
    const { result } = renderHook(() => useNotificationManager());

    mockTriggerBackgroundCheck.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.triggerBackgroundCheck();
    });

    expect(mockTriggerBackgroundCheck).toHaveBeenCalledTimes(1);
  });

  it("should call background getStatus when getBackgroundStatus is called", () => {
    const { result } = renderHook(() => useNotificationManager());

    const mockStatus = { isRunning: true, taskId: "test-task-id" };
    mockGetBackgroundStatus.mockReturnValue(mockStatus);

    const status = result.current.getBackgroundStatus();

    expect(mockGetBackgroundStatus).toHaveBeenCalledTimes(1);
    expect(status).toEqual(mockStatus);
  });

  it("should handle missing current profile gracefully", () => {
    mockUseAppSelector.mockReturnValue(null);

    const { result } = renderHook(() => useNotificationManager());

    const mockNotification: KeriaNotification = {
      id: "test-notification-id",
      createdAt: "2024-01-01T00:00:00Z",
      read: false,
      a: {
        r: "/notification/route",
        m: "Test notification message",
      },
      connectionId: "test-connection-id",
      groupReplied: false,
      receivingPre: "any-profile-id",
    };

    act(() => {
      result.current.showProfileNotification(mockNotification);
    });

    // Should not show notification when no current profile
    expect(mockShowLocalNotification).not.toHaveBeenCalled();
  });
});
