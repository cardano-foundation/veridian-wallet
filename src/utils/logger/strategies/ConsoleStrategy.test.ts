import { ConsoleStrategy } from "./ConsoleStrategy";
import { LogLevel, ParsedLogEntry } from "../ILogger";

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
    const logEntry: ParsedLogEntry = {
      id: "test-id",
      ts: expectedTimestamp,
      level: "debug",
      message: "Debug message",
      context: { key: "value" },
    };
    await consoleStrategy.log(logEntry);
    expect(mockConsoleDebug).toHaveBeenCalledTimes(1);
    expect(mockConsoleDebug).toHaveBeenCalledWith(`[${expectedTimestamp}] [DEBUG] ${logEntry.message}`, logEntry.context);
  });

  it("should call console.info for info level", async () => {
    const logEntry: ParsedLogEntry = {
      id: "test-id",
      ts: expectedTimestamp,
      level: "info",
      message: "Info message",
      context: { key: "value" },
    };
    await consoleStrategy.log(logEntry);
    expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
    expect(mockConsoleInfo).toHaveBeenCalledWith(`[${expectedTimestamp}] [INFO] ${logEntry.message}`, logEntry.context);
  });

  it("should call console.warn for warn level", async () => {
    const logEntry: ParsedLogEntry = {
      id: "test-id",
      ts: expectedTimestamp,
      level: "warn",
      message: "Warn message",
      context: { key: "value" },
    };
    await consoleStrategy.log(logEntry);
    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    expect(mockConsoleWarn).toHaveBeenCalledWith(`[${expectedTimestamp}] [WARN] ${logEntry.message}`, logEntry.context);
  });

  it("should call console.error for error level", async () => {
    const logEntry: ParsedLogEntry = {
      id: "test-id",
      ts: expectedTimestamp,
      level: "error",
      message: "Error message",
      context: { key: "value" },
    };
    await consoleStrategy.log(logEntry);
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith(`[${expectedTimestamp}] [ERROR] ${logEntry.message}`, logEntry.context);
  });

  it("should call console.log for an unknown level (default case)", async () => {
    const logEntry: ParsedLogEntry = {
      id: "test-id",
      ts: expectedTimestamp,
      level: "unknown" as LogLevel, // Test default case
      message: "Unknown level message",
      context: { key: "value" },
    };
    await consoleStrategy.log(logEntry);
    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(`[${expectedTimestamp}] [UNKNOWN] ${logEntry.message}`, logEntry.context);
  });

  it("should handle context being undefined", async () => {
    const logEntry: ParsedLogEntry = {
      id: "test-id",
      ts: expectedTimestamp,
      level: "info",
      message: "Message without context",
      context: undefined,
    };
    await consoleStrategy.log(logEntry);
    expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
    expect(mockConsoleInfo).toHaveBeenCalledWith(`[${expectedTimestamp}] [INFO] ${logEntry.message}`, undefined);
  });
});
