import { HybridStrategy } from "./HybridStrategy";
import { ILogger, LogLevel } from "../ILogger";

describe("HybridStrategy", () => {
  let mockLocalLogger: jest.Mocked<ILogger>;
  let mockRemoteLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockLocalLogger = {
      log: jest.fn(),
    };
    mockRemoteLogger = {
      log: jest.fn(),
    };
  });

  it("should log to remote logger if available and successful", async () => {
    const strategy = new HybridStrategy(mockLocalLogger, mockRemoteLogger);
    const level: LogLevel = "info";
    const message = "Test message";
    const context = { key: "value" };

    await strategy.log(level, message, context);

    expect(mockRemoteLogger.log).toHaveBeenCalledTimes(1);
    expect(mockRemoteLogger.log).toHaveBeenCalledWith(level, message, context);
    expect(mockLocalLogger.log).not.toHaveBeenCalled();
  });

  it("should log to local logger if remote logger is available but fails", async () => {
    mockRemoteLogger.log.mockRejectedValueOnce(new Error("Remote failed"));
    const strategy = new HybridStrategy(mockLocalLogger, mockRemoteLogger);
    const level: LogLevel = "error";
    const message = "Test message";
    const context = { key: "value" };

    await strategy.log(level, message, context);

    expect(mockRemoteLogger.log).toHaveBeenCalledTimes(1);
    expect(mockRemoteLogger.log).toHaveBeenCalledWith(level, message, context);
    expect(mockLocalLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLocalLogger.log).toHaveBeenCalledWith(level, message, context);
  });

  it("should log to local logger if remote logger is not available", async () => {
    const strategy = new HybridStrategy(mockLocalLogger, undefined);
    const level: LogLevel = "warn";
    const message = "Test message";
    const context = { key: "value" };

    await strategy.log(level, message, context);

    expect(mockRemoteLogger.log).not.toHaveBeenCalled();
    expect(mockLocalLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLocalLogger.log).toHaveBeenCalledWith(level, message, context);
  });

  it("should not log if neither local nor remote logger is available", async () => {
    const strategy = new HybridStrategy(undefined, undefined);
    const level: LogLevel = "debug";
    const message = "Test message";
    const context = { key: "value" };

    await strategy.log(level, message, context);

    expect(mockRemoteLogger.log).not.toHaveBeenCalled();
    expect(mockLocalLogger.log).not.toHaveBeenCalled();
  });

  it("should not log to local if remote fails but local is not available", async () => {
    mockRemoteLogger.log.mockRejectedValueOnce(new Error("Remote failed"));
    const strategy = new HybridStrategy(undefined, mockRemoteLogger);
    const level: LogLevel = "error";
    const message = "Test message";
    const context = { key: "value" };

    await strategy.log(level, message, context);

    expect(mockRemoteLogger.log).toHaveBeenCalledTimes(1);
    expect(mockRemoteLogger.log).toHaveBeenCalledWith(level, message, context);
    expect(mockLocalLogger.log).not.toHaveBeenCalled();
  });
});
