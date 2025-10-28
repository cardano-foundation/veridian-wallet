import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { ParsedLogEntry } from "../ILogger";
import { loggingConfig } from "../LoggingConfig";
import { LocalFileStrategy } from "./LocalFileStrategy";

jest.mock("signify-ts", () => ({
  ...jest.requireActual("signify-ts"),
  Salter: jest.fn(() => ({
    qb64: "qb64",
  })),
}));

// Mock @capacitor/filesystem
jest.mock("@capacitor/filesystem", () => ({
  Filesystem: {
    appendFile: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    getUri: jest.fn().mockResolvedValue({ uri: "file:///test-uri" }),
  },
  Directory: {
    Data: "DATA",
  },
  Encoding: {
    UTF8: "utf8",
  },
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

  const expectedTimestamp = "2023-01-01T12:00:00.000Z";

  describe("log", () => {
    it("should append a log entry to the file", async () => {
      const logEntry: ParsedLogEntry = {
        id: "test-id",
        ts: expectedTimestamp,
        level: "info",
        message: "Test message",
        context: { key: "value" },
      };
      const expectedEntry = JSON.stringify(logEntry) + "\n";

      await localFileStrategy.log(logEntry);

      expect(Filesystem.appendFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.appendFile).toHaveBeenCalledWith({
        path: mockLogFileName,
        data: expectedEntry,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    });

    it("should append multiple log entries to the file", async () => {
      const logEntry1: ParsedLogEntry = {
        id: "test-id-1",
        ts: expectedTimestamp,
        level: "info",
        message: "Message 1",
      };
      const logEntry2: ParsedLogEntry = {
        id: "test-id-2",
        ts: expectedTimestamp,
        level: "info",
        message: "Message 2",
      };

      await localFileStrategy.log(logEntry1);
      await localFileStrategy.log(logEntry2);

      expect(Filesystem.appendFile).toHaveBeenCalledTimes(2);
      expect(Filesystem.appendFile).toHaveBeenCalledWith({
        path: mockLogFileName,
        data: JSON.stringify(logEntry1) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      expect(Filesystem.appendFile).toHaveBeenCalledWith({
        path: mockLogFileName,
        data: JSON.stringify(logEntry2) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
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
        encoding: Encoding.UTF8,
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
        encoding: Encoding.UTF8,
      });
    });

    it("should write an empty string if no log entries are provided", async () => {
      await localFileStrategy.writeLogs([]);

      expect(Filesystem.writeFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: mockLogFileName,
        data: "",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    });
  });
});
