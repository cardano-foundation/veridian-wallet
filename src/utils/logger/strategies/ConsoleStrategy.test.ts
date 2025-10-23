import { ConsoleStrategy } from "./ConsoleStrategy";
import { LogLevel } from "../ILogger";

describe("ConsoleStrategy", () => {
  let consoleStrategy: ConsoleStrategy;
  let mockConsoleDebug: jest.SpyInstance;
  let mockConsoleInfo: jest.SpyInstance;
  let mockConsoleWarn: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    consoleStrategy = new ConsoleStrategy();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mockConsoleDebug = jest.spyOn(console, "debug").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mockConsoleInfo = jest.spyOn(console, "info").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mockConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    mockConsoleDebug.mockRestore();
    mockConsoleInfo.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
    jest.useRealTimers();
  });

  const expectedTimestamp = "2023-01-01T12:00:00.000Z";

  it("should call console.debug for debug level", async () => {
    const level: LogLevel = "debug";
    const message = "Debug message";
    const context = { key: "value" };
    await consoleStrategy.log(level, message, context);
    expect(mockConsoleDebug).toHaveBeenCalledTimes(1);
    expect(mockConsoleDebug).toHaveBeenCalledWith(`[${expectedTimestamp}] [DEBUG] ${message}`, context);
  });

  it("should call console.info for info level", async () => {
    const level: LogLevel = "info";
    const message = "Info message";
    const context = { key: "value" };
    await consoleStrategy.log(level, message, context);
    expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
    expect(mockConsoleInfo).toHaveBeenCalledWith(`[${expectedTimestamp}] [INFO] ${message}`, context);
  });

  it("should call console.warn for warn level", async () => {
    const level: LogLevel = "warn";
    const message = "Warn message";
    const context = { key: "value" };
    await consoleStrategy.log(level, message, context);
    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    expect(mockConsoleWarn).toHaveBeenCalledWith(`[${expectedTimestamp}] [WARN] ${message}`, context);
  });

  it("should call console.error for error level", async () => {
    const level: LogLevel = "error";
    const message = "Error message";
    const context = { key: "value" };
    await consoleStrategy.log(level, message, context);
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith(`[${expectedTimestamp}] [ERROR] ${message}`, context);
  });

  it("should call console.log for an unknown level (default case)", async () => {
    const level = "unknown" as LogLevel; // Test default case
    const message = "Unknown level message";
    const context = { key: "value" };
    await consoleStrategy.log(level, message, context);
    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(`[${expectedTimestamp}] [UNKNOWN] ${message}`, context);
  });

  it("should handle context being undefined", async () => {
    const level: LogLevel = "info";
    const message = "Message without context";
    await consoleStrategy.log(level, message, undefined);
    expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
    expect(mockConsoleInfo).toHaveBeenCalledWith(`[${expectedTimestamp}] [INFO] ${message}`, undefined);
  });
});
