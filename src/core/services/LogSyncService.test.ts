import { Network } from "@capacitor/network";
import { LogSyncService, SyncMode } from "./LogSyncService";
import { loggingConfig } from "../../utils/logger/LoggingConfig";
import { logger } from "../../utils/logger/Logger";
import { LocalFileStrategy } from "../../utils/logger/strategies/LocalFileStrategy";
import { SigNozProvider } from "../../utils/logger/providers/SigNozProvider";
import { BasicRecord } from "../agent/records";

jest.mock("../agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        createOrUpdateBasicRecord: jest.fn(),
      },
    },
  },
}));

import { Agent } from "../agent/agent";

jest.mock("@capacitor/network", () => ({
  Network: {
    getStatus: jest.fn(),
    addListener: jest.fn(),
  },
}));

jest.mock("../../utils/logger/Logger");
jest.mock("../../utils/logger/strategies/LocalFileStrategy");
jest.mock("../../utils/logger/providers/SigNozProvider");

jest.mock("../../utils/logger/LoggingConfig", () => ({
  loggingConfig: {
    mode: "info",
    consoleEnabled: false,
    localEnabled: true,
    remoteEnabled: true,
    signozOtlpEndpoint: "http://test-endpoint",
    signozIngestionKey: "test-key",
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
      SyncMode.Auto
    );
  });

  afterEach(() => {
    (loggingConfig as any).remoteEnabled = true;
  });

  it("should not sync if remote logging is disabled", async () => {
    (loggingConfig as any).remoteEnabled = false;
    await logSyncService.start();
    expect(Network.getStatus).not.toHaveBeenCalled();
  });

  it("should not sync if offline", async () => {
    (Network.getStatus as jest.Mock).mockResolvedValue({ connected: false });
    await logSyncService.start();
    expect(mockLocalStrategy.readLogs).not.toHaveBeenCalled();
  });

  it("should do nothing if there are no pending logs", async () => {
    (Agent.agent.basicStorage.findById as jest.Mock).mockResolvedValue(null);
    (Agent.agent.basicStorage.createOrUpdateBasicRecord as jest.Mock).mockResolvedValue(undefined);
    mockLocalStrategy.readLogs.mockResolvedValue([]);
    await logSyncService.start();
    expect(mockRemoteStrategy.logBatch).not.toHaveBeenCalled();
  });

  it("should sync logs successfully in a single batch", async () => {
    (Agent.agent.basicStorage.findById as jest.Mock).mockResolvedValue(null);
    mockLocalStrategy.readLogs.mockResolvedValue(mockLogs);
    mockRemoteStrategy.logBatch.mockResolvedValue(undefined);

    await logSyncService.start();

    expect(mockLocalStrategy.readLogs).toHaveBeenCalledTimes(1);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes(1);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledWith(mockLogs);
    expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'lastSyncedLogIdRecord',
        content: { lastSyncedLogId: '2' },
      })
    );
  });

  it("should sync logs in multiple batches", async () => {
    const largeMockLogs = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      message: `test${i}`,
    })) as any;
    (loggingConfig as any).batchSize = 40;
    (Agent.agent.basicStorage.findById as jest.Mock).mockResolvedValue(null);
    mockLocalStrategy.readLogs.mockResolvedValue(largeMockLogs);
    mockRemoteStrategy.logBatch.mockResolvedValue(undefined);

    await logSyncService.start();

    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledTimes(3);
    expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toHaveBeenCalledTimes(3);
    expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'lastSyncedLogIdRecord',
        content: { lastSyncedLogId: '99' },
      })
    );
  });

  it('should resume syncing from last synced log', async () => {
    const allLogs = Array.from({ length: 10 }, (_, i) => ({ id: `${i}`, message: `log ${i}` }));
    const lastSyncedRecord = new BasicRecord({ id: 'lastSyncedLogIdRecord', content: { lastSyncedLogId: '4' } });
    (Agent.agent.basicStorage.findById as jest.Mock).mockResolvedValue(lastSyncedRecord);
    mockLocalStrategy.readLogs.mockResolvedValue(allLogs as any);
    mockRemoteStrategy.logBatch.mockResolvedValue(undefined);

    await logSyncService.syncLogs();

    const expectedLogsToSend = allLogs.slice(5);
    expect(mockRemoteStrategy.logBatch).toHaveBeenCalledWith(expectedLogsToSend);
    expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'lastSyncedLogIdRecord',
        content: { lastSyncedLogId: '9' },
      })
    );
  });

  it("should handle remote failure gracefully", async () => {
    (Agent.agent.basicStorage.findById as jest.Mock).mockResolvedValue(null);
    mockLocalStrategy.readLogs.mockResolvedValue(mockLogs);
    mockRemoteStrategy.logBatch.mockRejectedValue(new Error("Sync failed"));

    await logSyncService.start();

    expect(logger.error).toHaveBeenCalledWith(
      "Log sync failed. Will retry on next occasion.",
      { error: new Error("Sync failed") }
    );
    expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).not.toHaveBeenCalled();
  });

  it("should handle failure when reading logs", async () => {
    (Agent.agent.basicStorage.findById as jest.Mock).mockResolvedValue(null);
    mockLocalStrategy.readLogs.mockRejectedValue(new Error("Read error"));
    await logSyncService.start();
    expect(logger.error).toHaveBeenCalledWith(
      "Log sync failed. Will retry on next occasion.",
      { error: new Error("Read error") }
    );
    expect(mockRemoteStrategy.logBatch).not.toHaveBeenCalled();
  });
});