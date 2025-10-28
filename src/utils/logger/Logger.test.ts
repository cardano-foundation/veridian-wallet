import { Logger } from "./Logger";
import { LocalFileStrategy } from "./strategies/LocalFileStrategy";
import { SigNozProvider } from "./providers/SigNozProvider";
import { HybridStrategy } from "./strategies/HybridStrategy";
import { ConsoleStrategy } from "./strategies/ConsoleStrategy";
import { loggingConfig } from "./LoggingConfig";

jest.mock("signify-ts", () => ({
  ...jest.requireActual("signify-ts"),
  Salter: jest.fn(() => ({
    qb64: "qb64",
  })),
}));

// Mock the strategies
jest.mock("./strategies/LocalFileStrategy");
jest.mock("./providers/SigNozProvider");
jest.mock("./strategies/HybridStrategy");
jest.mock("./strategies/ConsoleStrategy");

// Mock loggingConfig
jest.mock("./LoggingConfig", () => ({
  loggingConfig: {
    mode: "info",
    consoleEnabled: false,
    localEnabled: false,
    remoteEnabled: false,
    signozOtlpEndpoint: "http://localhost:4318/v1/logs",
    signozIngestionKey: "test-key",
  },
}));

describe("Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the singleton instance of Logger before each test
    (Logger as any).instance = undefined;

    // Reset loggingConfig to a default state for each test
    (loggingConfig as any).mode = "info";
    (loggingConfig as any).consoleEnabled = false;
    (loggingConfig as any).localEnabled = false;
    (loggingConfig as any).remoteEnabled = false;
    (loggingConfig as any).signozOtlpEndpoint = "http://localhost:4318/v1/logs";
    (loggingConfig as any).signozIngestionKey = "test-key";
  });

  it("should return a singleton instance", () => {
    const logger1 = Logger.getInstance();
    const logger2 = Logger.getInstance();
    expect(logger1).toBe(logger2);
  });

  describe("getInstance with different logging configurations", () => {
    it("should return a logger with no active strategies when mode is off", () => {
      (loggingConfig as any).mode = "off";
      (loggingConfig as any).consoleEnabled = true; // Should be ignored
      const logger = Logger.getInstance();
      expect((logger as any).strategies).toHaveLength(0);
      expect((logger as any).minimumLogLevel).toBe("error");
    });

    it("should enable ConsoleStrategy when consoleEnabled is true", () => {
      (loggingConfig as any).mode = "info";
      (loggingConfig as any).consoleEnabled = true;
      const logger = Logger.getInstance();
      expect((logger as any).strategies).toHaveLength(1);
      expect(ConsoleStrategy).toHaveBeenCalledTimes(1);
      expect((ConsoleStrategy as jest.Mock).mock.instances[0]).toBeInstanceOf(ConsoleStrategy);
    });

    it("should enable LocalFileStrategy when localEnabled is true", () => {
      (loggingConfig as any).mode = "info";
      (loggingConfig as any).localEnabled = true;
      const logger = Logger.getInstance();
      expect((logger as any).strategies).toHaveLength(1);
      expect(LocalFileStrategy).toHaveBeenCalledTimes(1);
      expect((LocalFileStrategy as jest.Mock).mock.instances[0]).toBeInstanceOf(LocalFileStrategy);
    });

    it("should enable SigNozProvider when remoteEnabled is true", () => {
      (loggingConfig as any).mode = "info";
      (loggingConfig as any).remoteEnabled = true;
      const logger = Logger.getInstance();
      expect((logger as any).strategies).toHaveLength(1);
      expect(SigNozProvider).toHaveBeenCalledTimes(1);
      expect((SigNozProvider as jest.Mock).mock.instances[0]).toBeInstanceOf(SigNozProvider);
    });

    it("should enable HybridStrategy when both localEnabled and remoteEnabled are true", () => {
      (loggingConfig as any).mode = "info";
      (loggingConfig as any).localEnabled = true;
      (loggingConfig as any).remoteEnabled = true;
      const logger = Logger.getInstance();
      expect((logger as any).strategies).toHaveLength(1);
      expect(HybridStrategy).toHaveBeenCalledTimes(1);
      expect((HybridStrategy as jest.Mock).mock.instances[0]).toBeInstanceOf(HybridStrategy);
      expect(LocalFileStrategy).toHaveBeenCalledTimes(1);
      expect(SigNozProvider).toHaveBeenCalledTimes(1);
    });

    it("should set minimumLogLevel based on loggingConfig.mode", () => {
      (loggingConfig as any).mode = "debug";
      const logger = Logger.getInstance();
      expect((logger as any).minimumLogLevel).toBe("debug");

      // Reset instance for next test
      (Logger as any).instance = undefined;

      (loggingConfig as any).mode = "warn";
      const logger2 = Logger.getInstance();
      expect((logger2 as any).minimumLogLevel).toBe("warn");
    });

    it("should default minimumLogLevel to info if loggingConfig.mode is invalid", () => {
      (loggingConfig as any).mode = "invalid_mode";
      const logger = Logger.getInstance();
      expect((logger as any).minimumLogLevel).toBe("info");
    });
  });

  describe("log method", () => {
    let mockConsoleStrategyInstance: jest.Mocked<ConsoleStrategy>;
    let loggerInstance: Logger;

    beforeEach(() => {
      // Ensure a strategy is active for log tests
      (loggingConfig as any).mode = "debug";
      (loggingConfig as any).consoleEnabled = true;
      // Re-get instance to apply new config
      (Logger as any).instance = undefined;
      loggerInstance = Logger.getInstance();
      mockConsoleStrategyInstance = (ConsoleStrategy as jest.Mock).mock.instances[(ConsoleStrategy as jest.Mock).mock.instances.length - 1] as jest.Mocked<ConsoleStrategy>;
    });

    it("should call log on all active strategies", async () => {
      const message = "Test message";
      const context = { key: "value" };
      await loggerInstance.log("info", message, context);
      expect(mockConsoleStrategyInstance.log).toHaveBeenCalledWith({
        id: expect.any(String),
        ts: expect.any(String),
        level: "info",
        message,
        context,
      });
    });

    it("should not log messages below minimumLogLevel", async () => {
      (loggingConfig as any).mode = "warn"; // Set mode to warn for this test
      (loggingConfig as any).consoleEnabled = true; // Ensure console is enabled for this test
      // Re-get instance to apply new config
      (Logger as any).instance = undefined;
      loggerInstance = Logger.getInstance();
      mockConsoleStrategyInstance = (ConsoleStrategy as jest.Mock).mock.instances[(ConsoleStrategy as jest.Mock).mock.instances.length - 1] as jest.Mocked<ConsoleStrategy>;

      await loggerInstance.log("info", "Info message");
      expect(mockConsoleStrategyInstance.log).not.toHaveBeenCalled();
    });

    it("should always log error messages regardless of minimumLogLevel", async () => {
      (loggingConfig as any).mode = "warn"; // Set mode to warn for this test
      // The loggerInstance and mockConsoleStrategyInstance are already set up in beforeEach

      await loggerInstance.log("error", "Error message");
      expect(mockConsoleStrategyInstance.log).toHaveBeenCalledWith({
        id: expect.any(String),
        ts: expect.any(String),
        level: "error",
        message: "Error message",
        context: undefined,
      });
    });
  });

  describe("convenience methods", () => {
    let loggerInstance: Logger;
    let mockConsoleStrategyInstance: jest.Mocked<ConsoleStrategy>;

    beforeEach(() => {
      (loggingConfig as any).mode = "debug";
      (loggingConfig as any).consoleEnabled = true;
      // Re-get instance to apply new config
      (Logger as any).instance = undefined;
      loggerInstance = Logger.getInstance();
      mockConsoleStrategyInstance = (ConsoleStrategy as jest.Mock).mock.instances[0] as jest.Mocked<ConsoleStrategy>;
    });

    it("debug should call log with debug level", async () => {
      const message = "Debug message";
      const context = { debug: true };
      await loggerInstance.debug(message, context);
      expect(mockConsoleStrategyInstance.log).toHaveBeenCalledWith({
        id: expect.any(String),
        ts: expect.any(String),
        level: "debug",
        message,
        context,
      });
    });

    it("info should call log with info level", async () => {
      const message = "Info message";
      const context = { info: true };
      await loggerInstance.info(message, context);
      expect(mockConsoleStrategyInstance.log).toHaveBeenCalledWith({
        id: expect.any(String),
        ts: expect.any(String),
        level: "info",
        message,
        context,
      });
    });

    it("warn should call log with warn level", async () => {
      const message = "Warn message";
      const context = { warn: true };
      await loggerInstance.warn(message, context);
      expect(mockConsoleStrategyInstance.log).toHaveBeenCalledWith({
        id: expect.any(String),
        ts: expect.any(String),
        level: "warn",
        message,
        context,
      });
    });

    it("error should call log with error level", async () => {
      const message = "Error message";
      const context = { error: true };
      await loggerInstance.error(message, context);
      expect(mockConsoleStrategyInstance.log).toHaveBeenCalledWith({
        id: expect.any(String),
        ts: expect.any(String),
        level: "error",
        message,
        context,
      });
    });
  });
});
