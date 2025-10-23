import { Salter } from "signify-ts";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { LogLevel, ParsedLogEntry } from "../ILogger";
import { loggingConfig } from "../LoggingConfig";
import { LocalFileStrategy } from "./LocalFileStrategy";

// Mock @capacitor/filesystem
jest.mock("@capacitor/filesystem", () => ({
  Filesystem: {
    appendFile: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
  Directory: {
    Data: "DATA",
  },
}));

// Mock signify-ts Salter
jest.mock("signify-ts", () => ({
  Salter: jest.fn().mockImplementation(() => ({
    qb64: "mocked-salter-id",
  })),
}));

describe("LocalFileStrategy", () => {
  let localFileStrategy: LocalFileStrategy;
  const mockLogFileName = "test-offline-logs.txt";

  let originalBlob: typeof Blob;

  beforeEach(() => {
    // Store original Blob constructor
    originalBlob = global.Blob;

    // Reset mocks
    jest.clearAllMocks();
    // Ensure loggingConfig has the test file name
    (loggingConfig as any).offlineLogFileName = mockLogFileName;
    localFileStrategy = new LocalFileStrategy();

    // Mock Date for consistent timestamps
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    // Restore original Blob constructor
    global.Blob = originalBlob;
  });

  describe("log", () => {
    it("should append a log entry to the file", async () => {
      const level: LogLevel = "info";
      const message = "Test message";
      const context = { key: "value" };
      const expectedEntry = JSON.stringify({
        id: "mocked-salter-id",
        ts: "2023-01-01T12:00:00.000Z",
        level,
        message,
        context,
      }) + "\n";

      await localFileStrategy.log(level, message, context);

      expect(Filesystem.appendFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.appendFile).toHaveBeenCalledWith({
        path: mockLogFileName,
        data: expectedEntry,
        directory: Directory.Data,
      });
    });

    it("should generate a new ID for each log entry", async () => {
      await localFileStrategy.log("info", "Message 1");
      await localFileStrategy.log("info", "Message 2");

      expect(Salter).toHaveBeenCalledTimes(2);
      expect(Filesystem.appendFile).toHaveBeenCalledTimes(2);
    });
  });

  describe("readLogs", () => {
    it("should return an empty array if the log file does not exist", async () => {
      (Filesystem.readFile as jest.Mock).mockRejectedValueOnce(new Error("File not found"));

      const logs = await localFileStrategy.readLogs();

      expect(Filesystem.readFile).toHaveBeenCalledTimes(1);
      expect(logs).toEqual([]);
    });

    it("should read and parse log entries from the file", async () => {
      const logEntry1: ParsedLogEntry = {
        id: "id-1",
        ts: "2023-01-01T10:00:00.000Z",
        level: "info",
        message: "Log 1",
      };
      const logEntry2: ParsedLogEntry = {
        id: "id-2",
        ts: "2023-01-01T11:00:00.000Z",
        level: "warn",
        message: "Log 2",
        context: { user: "test" },
      };
      const fileContent = JSON.stringify(logEntry1) + "\n" + JSON.stringify(logEntry2) + "\n";

      (Filesystem.readFile as jest.Mock).mockResolvedValueOnce({ data: fileContent });

      const logs = await localFileStrategy.readLogs();

      expect(Filesystem.readFile).toHaveBeenCalledTimes(1);
      expect(logs).toEqual([logEntry1, logEntry2]);
    });

    it("should handle file content as Blob", async () => {
      const logEntry: ParsedLogEntry = {
        id: "id-blob",
        ts: "2023-01-01T12:00:00.000Z",
        level: "debug",
        message: "Blob message",
      };
      const fileContent = JSON.stringify(logEntry) + "\n";

      // Mock the Blob constructor to return an object with a mockable text method
      const mockBlobInstance = {
        text: jest.fn().mockResolvedValueOnce(fileContent),
      };
      global.Blob = jest.fn().mockImplementation(() => mockBlobInstance) as jest.Mock;

      (Filesystem.readFile as jest.Mock).mockResolvedValueOnce({ data: mockBlobInstance });

      const logs = await localFileStrategy.readLogs();

      expect(Filesystem.readFile).toHaveBeenCalledTimes(1);
      expect(mockBlobInstance.text).toHaveBeenCalledTimes(1);
      expect(logs).toEqual([logEntry]);
    });
  });

  describe("clearLogs", () => {
    it("should clear the log file", async () => {
      await localFileStrategy.clearLogs();

      expect(Filesystem.writeFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: mockLogFileName,
        data: "",
        directory: Directory.Data,
      });
    });
  });

  describe("writeLogs", () => {
    it("should write log entries to the file", async () => {
      const logEntry1: ParsedLogEntry = {
        id: "id-1",
        ts: "2023-01-01T10:00:00.000Z",
        level: "info",
        message: "Log 1",
      };
      const logEntry2: ParsedLogEntry = {
        id: "id-2",
        ts: "2023-01-01T11:00:00.000Z",
        level: "warn",
        message: "Log 2",
        context: { user: "test" },
      };
      const logEntries = [logEntry1, logEntry2];
      const expectedData = JSON.stringify(logEntry1) + "\n" + JSON.stringify(logEntry2) + "\n";

      await localFileStrategy.writeLogs(logEntries);

      expect(Filesystem.writeFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: mockLogFileName,
        data: expectedData,
        directory: Directory.Data,
      });
    });

    it("should write an empty string if no log entries are provided", async () => {
      await localFileStrategy.writeLogs([]);

      expect(Filesystem.writeFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: mockLogFileName,
        data: "",
        directory: Directory.Data,
      });
    });
  });
});
