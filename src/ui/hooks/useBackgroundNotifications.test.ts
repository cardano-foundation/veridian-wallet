import { renderHook, act } from "@testing-library/react";
import { useBackgroundNotifications } from "./useBackgroundNotifications";
import { backgroundNotificationService } from "../../core/services/backgroundNotificationService";

// Mock the background notification service
jest.mock("../../core/services/backgroundNotificationService", () => ({
  backgroundNotificationService: {
    triggerBackgroundCheck: jest.fn(),
    getStatus: jest.fn(),
  },
}));

describe("useBackgroundNotifications", () => {
  const mockTriggerBackgroundCheck = jest.fn();
  const mockGetStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      backgroundNotificationService.triggerBackgroundCheck as jest.Mock
    ).mockImplementation(mockTriggerBackgroundCheck);
    (backgroundNotificationService.getStatus as jest.Mock).mockImplementation(
      mockGetStatus
    );
  });

  it("should return triggerBackgroundCheck and getStatus functions", () => {
    const { result } = renderHook(() => useBackgroundNotifications());

    expect(result.current.triggerBackgroundCheck).toBeDefined();
    expect(typeof result.current.triggerBackgroundCheck).toBe("function");
    expect(result.current.getStatus).toBeDefined();
    expect(typeof result.current.getStatus).toBe("function");
  });

  it("should call backgroundNotificationService.triggerBackgroundCheck when triggerBackgroundCheck is called", async () => {
    const { result } = renderHook(() => useBackgroundNotifications());

    mockTriggerBackgroundCheck.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.triggerBackgroundCheck();
    });

    expect(mockTriggerBackgroundCheck).toHaveBeenCalledTimes(1);
  });

  it("should call backgroundNotificationService.getStatus when getStatus is called", () => {
    const { result } = renderHook(() => useBackgroundNotifications());

    const mockStatus = { isRunning: true, taskId: "test-task-id" };
    mockGetStatus.mockReturnValue(mockStatus);

    const status = result.current.getStatus();

    expect(mockGetStatus).toHaveBeenCalledTimes(1);
    expect(status).toEqual(mockStatus);
  });

  it("should handle triggerBackgroundCheck errors gracefully", async () => {
    const { result } = renderHook(() => useBackgroundNotifications());

    const testError = new Error("Background check failed");
    mockTriggerBackgroundCheck.mockRejectedValue(testError);

    await expect(result.current.triggerBackgroundCheck()).rejects.toThrow(
      "Background check failed"
    );
    expect(mockTriggerBackgroundCheck).toHaveBeenCalledTimes(1);
  });
});
