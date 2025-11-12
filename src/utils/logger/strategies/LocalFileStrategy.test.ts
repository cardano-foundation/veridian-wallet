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

describe("LocalFileStrategy", () => {
  let localFileStrategy: LocalFileStrategy;
  const originalLogRetentionDays = loggingConfig.logRetentionDays;

  beforeEach(() => {
    (Filesystem as any).__reset();
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-03T12:00:00.000Z")); // Set a consistent date for tests
    (loggingConfig as any).logRetentionDays = 3; // Default for tests
    localFileStrategy = new LocalFileStrategy();
  });

  afterEach(() => {
    jest.useRealTimers();
    (loggingConfig as any).logRetentionDays = originalLogRetentionDays; // Restore original config
  });

  const getLogEntry = (
    message: string,
    date: Date = new Date()
  ): ParsedLogEntry => ({
    id: `id-${message}`,
    ts: date.toISOString(),
    level: "info",
    message: message,
    context: { key: "value" },
  });

  const getLogFileName = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `offline-logs-${year}-${month}-${day}.txt`;
  };

  describe("log", () => {
    test("should append a log entry to the current day's file", async () => {
      const today = new Date("2023-01-03T12:00:00.000Z");
      const logEntry = getLogEntry("Test message", today);
      const expectedFileName = getLogFileName(today);
      const expectedEntry = JSON.stringify(logEntry) + "\n";

      await localFileStrategy.log(logEntry);

      expect(Filesystem.appendFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.appendFile).toHaveBeenCalledWith({
        path: expectedFileName,
        data: expectedEntry,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const { data } = await Filesystem.readFile({
        path: expectedFileName,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      expect(data).toBe(expectedEntry);
    });

    test("should create a new file for a new day", async () => {
      const day1 = new Date("2023-01-03T12:00:00.000Z");
      const logEntry1 = getLogEntry("Day 1 message", day1);
      const expectedFileName1 = getLogFileName(day1);

      await localFileStrategy.log(logEntry1);

      jest.setSystemTime(new Date("2023-01-04T12:00:00.000Z"));
      const day2 = new Date("2023-01-04T12:00:00.000Z");
      const logEntry2 = getLogEntry("Day 2 message", day2);
      const expectedFileName2 = getLogFileName(day2);

      await localFileStrategy.log(logEntry2);

      expect(Filesystem.appendFile).toHaveBeenCalledTimes(2);
      const { data: data1 } = await Filesystem.readFile({
        path: expectedFileName1,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      expect(data1).toBe(JSON.stringify(logEntry1) + "\n");
      const { data: data2 } = await Filesystem.readFile({
        path: expectedFileName2,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      expect(data2).toBe(JSON.stringify(logEntry2) + "\n");
    });

    test("should call cleanupOldLogFiles once per day", async () => {
      const logEntry = getLogEntry("Test message");
      const cleanupSpy = jest.spyOn(
        localFileStrategy as any,
        "cleanupOldLogFiles"
      );

      await localFileStrategy.log(logEntry); // First log of the day
      await localFileStrategy.log(logEntry); // Second log of the day (same day)

      jest.setSystemTime(new Date("2023-01-04T12:00:00.000Z"));
      await localFileStrategy.log(logEntry); // First log of next day

      expect(cleanupSpy).toHaveBeenCalledTimes(2); // Once for 2023-01-03, once for 2023-01-04
    });

    test("should use writeFile as fallback if appendFile fails", async () => {
      (Filesystem.appendFile as jest.Mock).mockRejectedValueOnce(
        new Error("Append failed")
      );
      const today = new Date("2023-01-03T12:00:00.000Z");
      const logEntry = getLogEntry("Test message", today);
      const expectedFileName = getLogFileName(today);
      const expectedEntry = JSON.stringify(logEntry) + "\n";

      await localFileStrategy.log(logEntry);

      expect(Filesystem.appendFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.writeFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: expectedFileName,
        data: expectedEntry,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const { data } = await Filesystem.readFile({
        path: expectedFileName,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      expect(data).toBe(expectedEntry);
    });
  });

  describe("cleanupOldLogFiles", () => {
    test("should delete log files older than retention days", async () => {
      (loggingConfig as any).logRetentionDays = 2; // Keep today and yesterday

      const day0 = new Date("2023-01-01T12:00:00.000Z"); // Oldest, should be deleted
      const day1 = new Date("2023-01-02T12:00:00.000Z");
      const day2 = new Date("2023-01-03T12:00:00.000Z"); // Today, should be kept

      const fileName0 = getLogFileName(day0);
      const fileName1 = getLogFileName(day1);
      const fileName2 = getLogFileName(day2);

      await Filesystem.writeFile({
        path: fileName0,
        data: JSON.stringify(getLogEntry("Log Day 0")) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      await Filesystem.writeFile({
        path: fileName1,
        data: JSON.stringify(getLogEntry("Log Day 1")) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      await Filesystem.writeFile({
        path: fileName2,
        data: JSON.stringify(getLogEntry("Log Day 2")) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      jest.setSystemTime(day2); // Current date is Day 2

      await (localFileStrategy as any).cleanupOldLogFiles();

      expect(Filesystem.deleteFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.deleteFile).toHaveBeenCalledWith({
        path: fileName0,
        directory: Directory.Data,
      });
      await expect(
        Filesystem.stat({ path: fileName0, directory: Directory.Data })
      ).rejects.toThrow("File not found");
      await expect(
        Filesystem.stat({ path: fileName1, directory: Directory.Data })
      ).resolves.toBeDefined();
      await expect(
        Filesystem.stat({ path: fileName2, directory: Directory.Data })
      ).resolves.toBeDefined();
    });

    test("should not delete current or future log files", async () => {
      (loggingConfig as any).logRetentionDays = 1; // Keep only today

      const day1 = new Date("2023-01-02T12:00:00.000Z"); // Should be deleted
      const day2 = new Date("2023-01-03T12:00:00.000Z"); // Today, should be kept

      const fileName1 = getLogFileName(day1);
      const fileName2 = getLogFileName(day2);

      await Filesystem.writeFile({
        path: fileName1,
        data: JSON.stringify(getLogEntry("Log Day 1")) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      await Filesystem.writeFile({
        path: fileName2,
        data: JSON.stringify(getLogEntry("Log Day 2")) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      jest.setSystemTime(day2); // Current date is Day 2

      await (localFileStrategy as any).cleanupOldLogFiles();

      expect(Filesystem.deleteFile).toHaveBeenCalledTimes(1);
      expect(Filesystem.deleteFile).toHaveBeenCalledWith({
        path: fileName1,
        directory: Directory.Data,
      });
      await expect(
        Filesystem.stat({ path: fileName2, directory: Directory.Data })
      ).resolves.toBeDefined();
    });

    test("should handle no log files gracefully", async () => {
      await (localFileStrategy as any).cleanupOldLogFiles();
      expect(Filesystem.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe("readLogs", () => {
    test("should read and combine log entries from multiple files, sorted by timestamp", async () => {
      const day1 = new Date("2023-01-02T12:00:00.000Z");
      const day2 = new Date("2023-01-03T12:00:00.000Z");

      const logEntry1 = getLogEntry("Log 1 Day 2", day2); // Newest
      const logEntry2 = getLogEntry("Log 1 Day 1", day1); // Oldest
      const logEntry3 = getLogEntry(
        "Log 2 Day 1",
        new Date(day1.getTime() + 1000)
      ); // Middle

      // Write to files in a non-chronological order
      await Filesystem.writeFile({
        path: getLogFileName(day2),
        data: JSON.stringify(logEntry1) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      await Filesystem.writeFile({
        path: getLogFileName(day1),
        data:
          JSON.stringify(logEntry2) + "\n" + JSON.stringify(logEntry3) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      const logs = await localFileStrategy.readLogs();

      expect(Filesystem.readdir).toHaveBeenCalledTimes(1);
      expect(Filesystem.readFile).toHaveBeenCalledTimes(2);
      // Assert that logs are sorted by timestamp
      expect(logs).toEqual([logEntry2, logEntry3, logEntry1]);
    });

    test("should return an empty array if no log files exist", async () => {
      const logs = await localFileStrategy.readLogs();
      expect(Filesystem.readdir).toHaveBeenCalledTimes(1);
      expect(Filesystem.readFile).not.toHaveBeenCalled();
      expect(logs).toEqual([]);
    });

    test("should handle empty log files gracefully", async () => {
      const day1 = new Date("2023-01-02T12:00:00.000Z");
      await Filesystem.writeFile({
        path: getLogFileName(day1),
        data: "",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      }); // Empty file

      const logs = await localFileStrategy.readLogs();
      expect(logs).toEqual([]);
    });
  });

  describe("clearLogs", () => {
    test("should delete all log files", async () => {
      const day1 = new Date("2023-01-02T12:00:00.000Z");
      const day2 = new Date("2023-01-03T12:00:00.000Z");

      await Filesystem.writeFile({
        path: getLogFileName(day1),
        data: JSON.stringify(getLogEntry("Log Day 1")) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      await Filesystem.writeFile({
        path: getLogFileName(day2),
        data: JSON.stringify(getLogEntry("Log Day 2")) + "\n",
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      await localFileStrategy.clearLogs();

      expect(Filesystem.readdir).toHaveBeenCalledTimes(1);
      expect(Filesystem.deleteFile).toHaveBeenCalledTimes(2);
      expect(Filesystem.deleteFile).toHaveBeenCalledWith({
        path: getLogFileName(day1),
        directory: Directory.Data,
      });
      expect(Filesystem.deleteFile).toHaveBeenCalledWith({
        path: getLogFileName(day2),
        directory: Directory.Data,
      });
      const { files } = await Filesystem.readdir({
        path: "",
        directory: Directory.Data,
      });
      expect(files).toEqual([]);
    });

    test("should do nothing if no log files exist", async () => {
      await localFileStrategy.clearLogs();
      expect(Filesystem.readdir).toHaveBeenCalledTimes(1);
      expect(Filesystem.deleteFile).not.toHaveBeenCalled();
    });
  });
});
