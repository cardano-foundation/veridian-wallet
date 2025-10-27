import { HybridStrategy } from "./HybridStrategy";
import { ILogger, ParsedLogEntry } from "../ILogger";
import { ICloudLogger } from "../ICloudLogger";

describe("HybridStrategy", () => {
  let mockLocalLogger: jest.Mocked<ILogger>;
  let mockCloudLogger: jest.Mocked<ICloudLogger>;

  beforeEach(() => {
    mockLocalLogger = {
      log: jest.fn(),
    };
    mockCloudLogger = {
      log: jest.fn(),
      logBatch: jest.fn(),
      flush: jest.fn(),
    };
  });

  const logEntry: ParsedLogEntry = {
    id: "test-id",
    ts: "2023-01-01T12:00:00.000Z",
    level: "info",
    message: "Test message",
    context: { key: "value" },
  };

  it("should log to cloud logger if available and successful", async () => {
    const strategy = new HybridStrategy(mockLocalLogger, mockCloudLogger);

    await strategy.log(logEntry);

    expect(mockCloudLogger.log).toHaveBeenCalledTimes(1);
    expect(mockCloudLogger.log).toHaveBeenCalledWith(logEntry);
    expect(mockLocalLogger.log).not.toHaveBeenCalled();
  });

  it("should log to local logger if cloud logger is available but fails", async () => {
    mockCloudLogger.log.mockRejectedValueOnce(new Error("Cloud failed"));
    const strategy = new HybridStrategy(mockLocalLogger, mockCloudLogger);

    await strategy.log(logEntry);

    expect(mockCloudLogger.log).toHaveBeenCalledTimes(1);
    expect(mockCloudLogger.log).toHaveBeenCalledWith(logEntry);
    expect(mockLocalLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLocalLogger.log).toHaveBeenCalledWith(logEntry);
  });

  it("should log to local logger if cloud logger is not available", async () => {
    const strategy = new HybridStrategy(mockLocalLogger, undefined);

    await strategy.log(logEntry);

    expect(mockCloudLogger.log).not.toHaveBeenCalled();
    expect(mockLocalLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLocalLogger.log).toHaveBeenCalledWith(logEntry);
  });

  it("should not log if neither local nor cloud logger is available", async () => {
    const strategy = new HybridStrategy(undefined, undefined);

    await strategy.log(logEntry);

    expect(mockCloudLogger.log).not.toHaveBeenCalled();
    expect(mockLocalLogger.log).not.toHaveBeenCalled();
  });

  it("should not log to local if cloud fails but local is not available", async () => {
    mockCloudLogger.log.mockRejectedValueOnce(new Error("Cloud failed"));
    const strategy = new HybridStrategy(undefined, mockCloudLogger);

    await strategy.log(logEntry);

    expect(mockCloudLogger.log).toHaveBeenCalledTimes(1);
    expect(mockCloudLogger.log).toHaveBeenCalledWith(logEntry);
    expect(mockLocalLogger.log).not.toHaveBeenCalled();
  });
});
