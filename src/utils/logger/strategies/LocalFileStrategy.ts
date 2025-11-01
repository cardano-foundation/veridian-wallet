import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { ILogger, ParsedLogEntry } from "../ILogger";
import { loggingConfig } from "../LoggingConfig";

export class LocalFileStrategy implements ILogger {
  private logFile = loggingConfig.offlineLogFileName;

  constructor() {
    // Log the file name
    // eslint-disable-next-line no-console
    console.debug(`LocalFileStrategy initialized. Log file name: ${this.logFile}`);

    // Log the full path using console.info
    Filesystem.getUri({
      directory: Directory.Data,
      path: this.logFile,
    }).then((result) => {
      // eslint-disable-next-line no-console
      console.info(`Full path to local log file: ${result.uri}`);
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.error(`Error getting URI for log file:`, e);
    });

    // To view the file content: 
    // - iOS: Open Terminal and run `cat "<result.uri>"` (replace with actual URI logged above)
    // - Android: Use Android Studio > View > Tool Windows > Device File Explorer > /data/data/org.cardanofoundation.idw/files/local-logs.txt
  }

  async log(logEntry: ParsedLogEntry) {
    // This implementation assumes `loggingConfig.maxLogFileSize` is defined in bytes.

    const newEntryString = JSON.stringify(logEntry) + "\n";
    // Using string length as a proxy for byte size in UTF8 is a reasonable approximation.
    const newEntrySize = newEntryString.length;

    let currentSize = 0;
    try {
      const fileStat = await Filesystem.stat({
        path: this.logFile,
        directory: Directory.Data
      });
      currentSize = fileStat.size;
    } catch (e) {
      // File likely doesn't exist yet, which is fine. currentSize remains 0.
    }

    // Check if rotation is needed
    if (currentSize + newEntrySize <= loggingConfig.maxLogFileSize) {
      // If not over the limit, just append and finish.
      await Filesystem.appendFile({
        path: this.logFile,
        data: newEntryString,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
      return;
    }

    // If limit is exceeded, perform precise rotation.
    const bytesToFree = currentSize + newEntrySize - loggingConfig.maxLogFileSize;
    const allLogs = await this.readLogs();

    let freedBytes = 0;
    let logsToRemoveCount = 0;

    // Iterate through old logs to find how many to remove.
    for (const oldLog of allLogs) {
      if (freedBytes >= bytesToFree) {
        break;
      }
      const oldLogString = JSON.stringify(oldLog) + "\n";
      freedBytes += oldLogString.length; // Approximation
      logsToRemoveCount++;
    }

    // Remove the oldest logs.
    const remainingLogs = allLogs.slice(logsToRemoveCount);

    // Add the new log.
    remainingLogs.push(logEntry);

    // Write the result back to the file.
    await this.writeLogs(remainingLogs);
  }

  async readLogs(): Promise<ParsedLogEntry[]> {
    try {
      const file = await Filesystem.readFile({
        path: this.logFile,
        directory: Directory.Data
      });
      let fileContent = file.data;
      if (typeof fileContent !== "string") {
        fileContent = await (fileContent as Blob).text();
      }
      return fileContent.split("\n").filter(Boolean).map(line => JSON.parse(line) as ParsedLogEntry);
    } catch {
      return [];
    }
  }

  async clearLogs() {
    await Filesystem.writeFile({
      path: this.logFile,
      data: "",
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
  }

  async writeLogs(logEntries: ParsedLogEntry[]) {
    const data = logEntries.map(entry => JSON.stringify(entry)).join("\n") + (logEntries.length > 0 ? "\n" : "");
    await Filesystem.writeFile({
      path: this.logFile,
      data: data,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
  }
}