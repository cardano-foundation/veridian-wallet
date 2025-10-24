import { Network } from "@capacitor/network";
import { LogSyncService } from "./LogSyncService";
import { loggingConfig } from "../../utils/logger/LoggingConfig";
import { logger } from "../../utils/logger/Logger";
import { LocalFileStrategy } from "../../utils/logger/strategies/LocalFileStrategy";
import { RemoteSigNozStrategy } from "../../utils/logger/strategies/RemoteSigNozStrategy";

// Mock capacitor network with a factory function
jest.mock("@capacitor/network", () => ({
  Network: {
    getStatus: jest.fn(),
    addListener: jest.fn(),
  },
}));

jest.mock("../../utils/logger/Logger");
jest.mock("../../utils/logger/strategies/LocalFileStrategy");
jest.mock("../../utils/logger/strategies/RemoteSigNozStrategy");
jest.mock("../../utils/logger/LoggingConfig");

// Cast the mocked loggingConfig to a mutable type for testing
const mutableLoggingConfig = loggingConfig as {
  localEnabled: boolean;
  remoteEnabled: boolean;
  maxSyncRetries: number;
  retryDelayMs: number;
  batchSize: number;
};

describe("LogSyncService", () => {
  let mockLocalStrategy: jest.Mocked<LocalFileStrategy>;
  let mockRemoteStrategy: jest.Mocked<RemoteSigNozStrategy>;
  let logSyncService: LogSyncService;
  let mockDelay: jest.Mock;

  const mockLogs = [
    { id: "1", message: "test1" },
    { id: "2", message: "test2" },
  ] as any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock config to defaults before each test
    mutableLoggingConfig.localEnabled = true;
    mutableLoggingConfig.remoteEnabled = true;
    mutableLoggingConfig.maxSyncRetries = 3;
    mutableLoggingConfig.retryDelayMs = 1000;
    mutableLoggingConfig.batchSize = 50;

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
    (RemoteSigNozStrategy as jest.Mock).mockImplementation(() => mockRemoteStrategy);

    logSyncService = new LogSyncService(
      () => mockLocalStrategy as any,
      () => mockRemoteStrategy as any,
      mockDelay
    );
  });

  it("should instantiate with default factories", () => {
    // This test exercises the default constructor parameters
    const serviceWithDefaults = new LogSyncService();
    expect(serviceWithDefaults).toBeInstanceOf(LogSyncService);
  });

  it("should not sync if local logging is disabled", async () => {
    mutableLoggingConfig.localEnabled = false;
    await logSyncService.start();
    expect(Network.getStatus).not.toHaveBeenCalled();
  });

  it("should not sync if remote logging is disabled", async () => {
    mutableLoggingConfig.remoteEnabled = false;
    await logSyncService.start();
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
    mutableLoggingConfig.batchSize = 40;
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

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(mockDelay).toHaveBeenCalledTimes(1);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes(2);
    expect(mockLocalStrategy.writeLogs).toHaveBeenCalledWith([]);
  });

  it("should stop retrying after max attempts and not clear local logs", async () => {
    mockLocalStrategy.readLogs.mockResolvedValue(mockLogs);
    mockRemoteStrategy.logBatch.mockRejectedValue(new Error("Sync failed"));

    await logSyncService.start();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("failed"),
      expect.any(Object)
    );
    expect(logger.error).toHaveBeenCalledWith(
      "Max log sync retries reached. Logs will remain in local storage."
    );
    expect(mockDelay).toHaveBeenCalledTimes(mutableLoggingConfig.maxSyncRetries - 1);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes(mutableLoggingConfig.maxSyncRetries);
    expect(mockLocalStrategy.writeLogs).not.toHaveBeenCalled();
  });

  it("should not clear logs if a later batch fails", async () => {
    const logs = [{ id: "1" }, { id: "2" }, { id: "3" }] as any;
    mutableLoggingConfig.batchSize = 2;
    mutableLoggingConfig.maxSyncRetries = 1; // Prevent retries for this specific test
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

    // The overall operation still retries because the write failure is inside the catch block
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

  it("should add and remove the network status listener", async () => {
    const removeMock = jest.fn();
    (Network.addListener as jest.Mock).mockResolvedValue({ remove: removeMock });

    await logSyncService.start();
    expect(Network.addListener).toHaveBeenCalledWith(
      "networkStatusChange",
      expect.any(Function)
    );

    logSyncService.stop();
    expect(removeMock).toHaveBeenCalledTimes(1);
  });
});