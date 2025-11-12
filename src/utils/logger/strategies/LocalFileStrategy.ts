import {
  Filesystem,
  Directory,
  Encoding,
  FileInfo,
  ReaddirResult,
} from "@capacitor/filesystem";
import { ILogger, ParsedLogEntry } from "../ILogger";
import { loggingConfig } from "../LoggingConfig";

export class LocalFileStrategy implements ILogger {
  private lastCleanupDate: string | null = null;
  private readonly logFilePrefix = "offline-logs-";
  private readonly logFileSuffix = ".txt";

  constructor() {
    // eslint-disable-next-line no-console
    console.debug(
      `LocalFileStrategy initialized. Log retention: ${loggingConfig.logRetentionDays} days.`
    );
  }

  private getLogFileName(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${this.logFilePrefix}${year}-${month}-${day}${this.logFileSuffix}`;
  }

  private async cleanupOldLogFiles(): Promise<void> {
    try {
      const result: ReaddirResult = await Filesystem.readdir({
        path: "",
        directory: Directory.Data,
      });

      const logFiles = result.files.filter((file: FileInfo | string) =>
        (typeof file === "string" ? file : file.name).startsWith(
          this.logFilePrefix
        )
      );

      const retentionDate = new Date();
      retentionDate.setDate(
        retentionDate.getDate() - (loggingConfig.logRetentionDays - 1)
      );
      // Set time to beginning of the day for accurate comparison
      retentionDate.setHours(0, 0, 0, 0);

      for (const file of logFiles) {
        const fileName = typeof file === "string" ? file : file.name;
        const datePart = fileName.substring(
          this.logFilePrefix.length,
          fileName.length - this.logFileSuffix.length
        );
        const fileDate = new Date(datePart);

        if (fileDate < retentionDate) {
          await Filesystem.deleteFile({
            path: fileName,
            directory: Directory.Data,
          });
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error during log file cleanup:", e);
    }
  }

  async log(logEntry: ParsedLogEntry): Promise<void> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (this.lastCleanupDate !== todayStr) {
      await this.cleanupOldLogFiles();
      this.lastCleanupDate = todayStr;
    }

    const logFileName = this.getLogFileName(today);
    const newEntryString = JSON.stringify(logEntry) + "\n";

    try {
      await Filesystem.appendFile({
        path: logFileName,
        data: newEntryString,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    } catch (e) {
      // If append fails, it might be because the file doesn't exist. Try writing it.
      // This is a fallback, as appendFile should create the file.
      await Filesystem.writeFile({
        path: logFileName,
        data: newEntryString,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    }
  }

  private async getAllLogFiles(): Promise<FileInfo[]> {
    try {
      const result: ReaddirResult = await Filesystem.readdir({
        path: "",
        directory: Directory.Data,
      });

      const fileInfos: FileInfo[] = result.files.map((f) =>
        typeof f === "string"
          ? {
              name: f,
              path: f,
              size: 0,
              ctime: 0,
              mtime: 0,
              uri: "",
              type: "file",
            }
          : f
      );

      return fileInfos
        .filter((file) => file.name.startsWith(this.logFilePrefix))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort chronologically by name
    } catch {
      return [];
    }
  }

  async readLogs(): Promise<ParsedLogEntry[]> {
    const logFiles = await this.getAllLogFiles();
    let allLogs: ParsedLogEntry[] = [];

    for (const fileInfo of logFiles) {
      try {
        const file = await Filesystem.readFile({
          path: fileInfo.name,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        const fileContent = file.data as string;
        if (fileContent) {
          const logsFromFile = fileContent
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line) as ParsedLogEntry);
          allLogs = allLogs.concat(logsFromFile);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error reading log file: ${fileInfo.name}`, e);
      }
    }
    // Sort logs by timestamp to ensure chronological order
    allLogs.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    return allLogs;
  }

  async clearLogs(): Promise<void> {
    const logFiles = await this.getAllLogFiles();
    for (const fileInfo of logFiles) {
      await Filesystem.deleteFile({
        path: fileInfo.name,
        directory: Directory.Data,
      });
    }
  }
}
