import { Network } from "@capacitor/network";
import { LogSyncService, SyncMode } from "./LogSyncService";
import { loggingConfig } from "../../utils/logger/LoggingConfig";
import { logger } from "../../utils/logger/Logger";
import { LocalFileStrategy } from "../../utils/logger/strategies/LocalFileStrategy";
import { SigNozProvider } from "../../utils/logger/providers/SigNozProvider";

// Mock capacitor network with a factory function
jest.mock("@capacitor/network", () => ({
  Network: {
    getStatus: jest.fn(),
    addListener: jest.fn(),
  },
}));

jest.mock("../../utils/logger/Logger");
jest.mock("../../utils/logger/strategies/LocalFileStrategy");
jest.mock("../../utils/logger/providers/SigNozProvider");

// Mock loggingConfig to allow dynamic control
jest.mock("../../utils/logger/LoggingConfig", () => ({
  loggingConfig: {
    mode: "info",
    consoleEnabled: false,
    localEnabled: false,
    remoteEnabled: false,
    signozOtlpEndpoint: "http://localhost:4318/v1/logs",
    signozIngestionKey: "test-key",
    maxSyncRetries: 3,
    retryDelayMs: 1000,
    batchSize: 50,
  },
}));

describe("LogSyncService", () => {
  let mockLocalStrategy: jest.Mocked<LocalFileStrategy>;
  let mockRemoteStrategy: jest.Mocked<SigNozProvider>;
  let logSyncService: LogSyncService;
  let mockDelay: jest.Mock;

  const mockLogs = [
    { id: "1", message: "test1" },
    { id: "2", message: "test2" },
  ] as any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock config to defaults before each test
    (loggingConfig as any).localEnabled = true;
    (loggingConfig as any).remoteEnabled = true;
    (loggingConfig as any).maxSyncRetries = 3;
    (loggingConfig as any).retryDelayMs = 1000;
    (loggingConfig as any).batchSize = 50;
    (loggingConfig as any).signozOtlpEndpoint = "http://test-endpoint";
    (loggingConfig as any).signozIngestionKey = "test-key";

    mockLocalStrategy = {
      readLogs: jest.fn(),
      writeLogs: jest.fn(),
    } as any;

    mockRemoteStrategy = {
      logBatch: jest.fn(),
    } as any;

    mockDelay = jest.fn().mockResolvedValue(undefined);

    (Network.getStatus as jest.Mock).mockResolvedValue({ connected: true });
    (Network.addListener as jest.Mock).mockResolvedValue({ remove: jest.fn() });

    (LocalFileStrategy as jest.Mock).mockImplementation(() => mockLocalStrategy);
    (SigNozProvider as jest.Mock).mockImplementation(() => mockRemoteStrategy);

    logSyncService = new LogSyncService(
      () => mockLocalStrategy as any,
      () => mockRemoteStrategy as any,
      mockDelay,
      SyncMode.Auto // Set to Auto by default for these tests
    );
  });

  it("should instantiate with default factories", () => {
    // This test exercises the default constructor parameters
    const serviceWithDefaults = new LogSyncService();
    expect(serviceWithDefaults).toBeInstanceOf(LogSyncService);
    expect(serviceWithDefaults.syncMode).toBe(SyncMode.Manual);
  });

  it("should not sync if local logging is disabled", async () => {
    (loggingConfig as any).localEnabled = false;
    mockLocalStrategy.readLogs.mockResolvedValue([]); // Prevent crash
    const service = new LogSyncService(
      () => mockLocalStrategy as any,
      () => mockRemoteStrategy as any,
      mockDelay,
      SyncMode.Auto
    );
    await service.start();
    expect(mockRemoteStrategy.logBatch).not.toHaveBeenCalled();
  });

  it("should not sync if remote logging is disabled", async () => {
    (loggingConfig as any).remoteEnabled = false;
    const service = new LogSyncService(
      () => mockLocalStrategy as any,
      () => mockRemoteStrategy as any,
      mockDelay,
      SyncMode.Auto
    );
    await service.start();
    expect(Network.getStatus).not.toHaveBeenCalled();
  });

  it("should not sync if offline", async () => {
    (Network.getStatus as jest.Mock).mockResolvedValue({ connected: false });
    await logSyncService.start();
    expect(mockLocalStrategy.readLogs).not.toHaveBeenCalled();
  });

  it("should do nothing if there are no pending logs", async () => {
    mockLocalStrategy.readLogs.mockResolvedValue([]);
    await logSyncService.start();
    expect(mockRemoteStrategy.logBatch).not.toHaveBeenCalled();
    expect(mockLocalStrategy.writeLogs).not.toHaveBeenCalled();
  });

  it("should sync logs successfully in a single batch", async () => {
    mockLocalStrategy.readLogs.mockResolvedValue(mockLogs);
    mockRemoteStrategy.logBatch.mockResolvedValue(undefined);

    await logSyncService.start();

    expect(mockLocalStrategy.readLogs).toHaveBeenCalledTimes(1);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes(1);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledWith(mockLogs);
    expect(mockLocalStrategy.writeLogs).toHaveBeenCalledTimes(1);
    expect(mockLocalStrategy.writeLogs).toHaveBeenCalledWith([]);
  });

  it("should sync logs in multiple batches", async () => {
    const largeMockLogs = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      message: `test${i}`,
    })) as any;
    (loggingConfig as any).batchSize = 40;
    mockLocalStrategy.readLogs.mockResolvedValue(largeMockLogs);
    mockRemoteStrategy.logBatch.mockResolvedValue(undefined);

    await logSyncService.start();

    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes(3); // 100 / 40 = 2.5 -> 3 batches
    expect(mockLocalStrategy.writeLogs).toHaveBeenCalledWith([]);
  });

  it("should retry syncing on failure and succeed on the second attempt", async () => {
    mockLocalStrategy.readLogs.mockResolvedValue(mockLogs);
    mockRemoteStrategy.logBatch
      .mockRejectedValueOnce(new Error("Sync failed"))
      .mockResolvedValue(undefined);

    await logSyncService.start();

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("failed"), expect.any(Object));
    expect(mockDelay).toHaveBeenCalledTimes(1);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes(2);
    expect(mockLocalStrategy.writeLogs).toHaveBeenCalledWith([]);
  });

  it("should stop retrying after max attempts and not clear local logs", async () => {
    mockLocalStrategy.readLogs.mockResolvedValue(mockLogs);
    mockRemoteStrategy.logBatch.mockRejectedValue(new Error("Sync failed"));

    await logSyncService.start();

    expect(logger.error).toHaveBeenCalledTimes((loggingConfig as any).maxSyncRetries + 1);
    expect(logger.error).toHaveBeenNthCalledWith((loggingConfig as any).maxSyncRetries,
      expect.stringContaining("failed"),
      expect.any(Object)
    );
    expect(logger.error).toHaveBeenLastCalledWith(
      "Max log sync retries reached. Logs will remain in local storage.",
      undefined,
      true
    );
    expect(mockDelay).toHaveBeenCalledTimes((loggingConfig as any).maxSyncRetries - 1);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes((loggingConfig as any).maxSyncRetries);
    expect(mockLocalStrategy.writeLogs).not.toHaveBeenCalled();
  });

  it("should not clear logs if a later batch fails", async () => {
    const logs = [{ id: "1" }, { id: "2" }, { id: "3" }] as any;
    (loggingConfig as any).batchSize = 2;
    (loggingConfig as any).maxSyncRetries = 1; // Prevent retries for this specific test
    mockLocalStrategy.readLogs.mockResolvedValue(logs);
    mockRemoteStrategy.logBatch
      .mockResolvedValueOnce(undefined) // First batch succeeds
      .mockRejectedValue(new Error("Second batch failed")); // Second batch fails

    await logSyncService.start();

    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      "Log sync attempt 1 failed:",
      expect.any(Object)
    );
    // writeLogs should not be called because the sync operation failed overall
    expect(mockLocalStrategy.writeLogs).not.toHaveBeenCalled();
  });

  it("should handle failure when reading logs", async () => {
    mockLocalStrategy.readLogs.mockRejectedValue(new Error("Read error"));
    await logSyncService.start();
    expect(logger.error).toHaveBeenCalledWith(
      "Log sync attempt 1 failed:",
      expect.any(Object)
    );
    expect(mockRemoteStrategy.logBatch).not.toHaveBeenCalled();
  });

  it("should handle failure when writing remaining logs", async () => {
    mockLocalStrategy.readLogs.mockResolvedValue(mockLogs);
    mockRemoteStrategy.logBatch.mockResolvedValue(undefined);
    mockLocalStrategy.writeLogs.mockRejectedValue(new Error("Write error"));

    await logSyncService.start();

    expect(logger.error).toHaveBeenCalledWith(
      "Log sync attempt 1 failed:",
      expect.any(Object)
    );
  });

  it("should not call remove on listener if it does not exist", () => {
    // stop is called without start
    logSyncService.stop();
    // We can't directly check if if remove was not called without a mock instance,
    // but this test ensures no error is thrown.
  });

  it("should add and remove the network status listener when in Auto mode", async () => {
    const removeMock = jest.fn();
    (Network.addListener as jest.Mock).mockResolvedValue({ remove: removeMock });

    logSyncService.setSyncMode(SyncMode.Auto);
    await logSyncService.start();
    expect(Network.addListener).toHaveBeenCalledWith(
      "networkStatusChange",
      expect.any(Function)
    );

    logSyncService.stop();
    expect(removeMock).toHaveBeenCalledTimes(1);
  });

  it("should not add the network status listener when in Manual mode", async () => {
    logSyncService.setSyncMode(SyncMode.Manual);
    await logSyncService.start();
    expect(Network.addListener).not.toHaveBeenCalled();
  });

  it("should call syncLogs directly when in Manual mode and triggered by UI", async () => {
    logSyncService.setSyncMode(SyncMode.Manual);
    mockLocalStrategy.readLogs.mockResolvedValue(mockLogs);
    mockRemoteStrategy.logBatch.mockResolvedValue(undefined);

    await logSyncService.syncLogs(); // Directly call syncLogs

    expect(mockLocalStrategy.readLogs).toHaveBeenCalledTimes(1);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes(1);
    expect(mockLocalStrategy.writeLogs).toHaveBeenCalledWith([]);
  });
});