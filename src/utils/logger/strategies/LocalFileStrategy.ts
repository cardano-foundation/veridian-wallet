import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { ILogger, ParsedLogEntry } from "../ILogger";
import { loggingConfig } from "../LoggingConfig";

export class LocalFileStrategy implements ILogger {
  private logFile = loggingConfig.offlineLogFileName;

  async log(logEntry: ParsedLogEntry) {
    const entry = JSON.stringify(logEntry) + "\n";

    await Filesystem.appendFile({
      path: this.logFile,
      data: entry,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
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
