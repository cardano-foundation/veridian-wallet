import { BackgroundTask } from "@capawesome/capacitor-background-task";
import { App } from "@capacitor/app";
import {
  backgroundNotificationService,
  BackgroundNotificationService,
} from "./backgroundNotificationService";
import { Agent } from "../../core/agent/agent";

// Mock Capacitor plugins
jest.mock("@capawesome/capacitor-background-task", () => ({
  BackgroundTask: {
    beforeExit: jest.fn(),
    finish: jest.fn(),
  },
}));

jest.mock("@capacitor/app", () => ({
  App: {
    addListener: jest.fn(),
  },
}));

// Mock Agent
jest.mock("../../core/agent/agent", () => ({
  Agent: {
    agent: {
      getKeriaOnlineStatus: jest.fn(),
      keriaNotifications: {
        pollNotifications: jest.fn(),
      },
    },
  },
}));

describe("BackgroundNotificationService", () => {
  let mockBackgroundTaskCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the singleton instance before each test
    (BackgroundNotificationService as any).instance = null;

    // Mock the background task callback
    mockBackgroundTaskCallback = jest.fn();
    (BackgroundTask.beforeExit as jest.Mock).mockImplementation((callback) => {
      mockBackgroundTaskCallback = callback;
      return Promise.resolve("task-123");
    });

    // Mock app state listener
    (App.addListener as jest.Mock).mockReturnValue({
      remove: jest.fn(),
    });
  });

  describe("initialization", () => {
    it("should initialize and set up app state listeners", () => {
      // Clear mocks before creating instance
      jest.clearAllMocks();

      // Create a fresh instance to test initialization
      const service = BackgroundNotificationService.getInstance();

      expect(App.addListener).toHaveBeenCalledWith(
        "appStateChange",
        expect.any(Function)
      );
    });

    it("should return the same instance (singleton)", () => {
      const service1 = BackgroundNotificationService.getInstance();
      const service2 = BackgroundNotificationService.getInstance();

      expect(service1).toBe(service2);
    });
  });

  describe("background task management", () => {
    it("should start background tasks when conditions are met", async () => {
      const service = BackgroundNotificationService.getInstance();

      // Mock KERIA being online
      (Agent.agent.getKeriaOnlineStatus as jest.Mock).mockReturnValue(true);

      // Manually start background tasks
      await (service as any).startBackgroundTasks();

      expect(BackgroundTask.beforeExit).toHaveBeenCalled();
      expect((service as any).isRunning).toBe(true);
    });

    it("should stop background tasks when app comes to foreground", () => {
      const service = BackgroundNotificationService.getInstance();

      // Set up running state
      (service as any).isRunning = true;
      (service as any).backgroundTaskId = "task-123";

      // Manually stop background tasks
      (service as any).stopBackgroundTasks();

      expect((service as any).isRunning).toBe(false);
      expect(BackgroundTask.finish).toHaveBeenCalledWith({
        taskId: "task-123",
      });
    });

    it("should not start background tasks if already running", async () => {
      const service = BackgroundNotificationService.getInstance();

      // Clear all mocks to ensure clean state
      jest.clearAllMocks();

      // Set up running state
      (service as any).isRunning = true;

      // Mock KERIA being online
      (Agent.agent.getKeriaOnlineStatus as jest.Mock).mockReturnValue(true);

      // Try to start background tasks
      await (service as any).startBackgroundTasks();

      expect(BackgroundTask.beforeExit).not.toHaveBeenCalled();
    });
  });

  describe("background check execution", () => {
    it("should perform background check when KERIA is online", async () => {
      const service = BackgroundNotificationService.getInstance();

      // Mock KERIA being online
      (Agent.agent.getKeriaOnlineStatus as jest.Mock).mockReturnValue(true);
      (
        Agent.agent.keriaNotifications.pollNotifications as jest.Mock
      ).mockResolvedValue(undefined);

      await (service as any).performBackgroundCheck();

      expect(
        Agent.agent.keriaNotifications.pollNotifications
      ).toHaveBeenCalled();
    });

    it("should skip background check when KERIA is offline", async () => {
      const service = BackgroundNotificationService.getInstance();

      // Mock KERIA being offline
      (Agent.agent.getKeriaOnlineStatus as jest.Mock).mockReturnValue(false);

      await (service as any).performBackgroundCheck();

      expect(
        Agent.agent.keriaNotifications.pollNotifications
      ).not.toHaveBeenCalled();
    });

    it("should skip background check when agent is not available", async () => {
      const service = BackgroundNotificationService.getInstance();

      // Mock agent being unavailable
      const originalAgent = Agent.agent;
      (Agent as any).agent = null;

      await (service as any).performBackgroundCheck();

      expect(
        originalAgent.keriaNotifications.pollNotifications
      ).not.toHaveBeenCalled();

      // Restore agent
      (Agent as any).agent = originalAgent;
    });

    it("should handle polling errors gracefully", async () => {
      const service = BackgroundNotificationService.getInstance();

      // Mock KERIA being online but polling failing
      (Agent.agent.getKeriaOnlineStatus as jest.Mock).mockReturnValue(true);
      (
        Agent.agent.keriaNotifications.pollNotifications as jest.Mock
      ).mockRejectedValue(new Error("Polling failed"));

      // Should not throw
      await expect(
        (service as any).performBackgroundCheck()
      ).resolves.toBeUndefined();
    });
  });

  describe("background task lifecycle", () => {
    it("should execute background task successfully", async () => {
      const service = BackgroundNotificationService.getInstance();

      // Mock successful background check
      (Agent.agent.getKeriaOnlineStatus as jest.Mock).mockReturnValue(true);
      (
        Agent.agent.keriaNotifications.pollNotifications as jest.Mock
      ).mockResolvedValue(undefined);

      // Start background task
      await (service as any).startBackgroundTasks();

      // Execute the background task callback
      await mockBackgroundTaskCallback();

      expect(BackgroundTask.finish).toHaveBeenCalledWith({
        taskId: "task-123",
      });
    });

    it("should handle background task errors", async () => {
      const service = BackgroundNotificationService.getInstance();

      // Mock background check failure
      (Agent.agent.getKeriaOnlineStatus as jest.Mock).mockReturnValue(false);

      // Start background task
      await (service as any).startBackgroundTasks();

      // Execute the background task callback
      await mockBackgroundTaskCallback();

      expect(BackgroundTask.finish).toHaveBeenCalledWith({
        taskId: "task-123",
      });
    });
  });

  describe("public API", () => {
    it("should allow manual background check triggering", async () => {
      const service = BackgroundNotificationService.getInstance();

      // Mock successful check
      (Agent.agent.getKeriaOnlineStatus as jest.Mock).mockReturnValue(true);
      (
        Agent.agent.keriaNotifications.pollNotifications as jest.Mock
      ).mockResolvedValue(undefined);

      await service.triggerBackgroundCheck();

      expect(
        Agent.agent.keriaNotifications.pollNotifications
      ).toHaveBeenCalled();
    });

    it("should provide service status", () => {
      const service = BackgroundNotificationService.getInstance();

      (service as any).isRunning = true;
      (service as any).backgroundTaskId = "task-456";

      const status = service.getStatus();

      expect(status).toEqual({
        isRunning: true,
        taskId: "task-456",
      });
    });
  });
});
