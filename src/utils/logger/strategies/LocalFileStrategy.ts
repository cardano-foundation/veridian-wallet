import { Filesystem, Directory } from "@capacitor/filesystem";
import { ILogger, LogLevel, ParsedLogEntry } from "../ILogger";

export class LocalFileStrategy implements ILogger {
  private logFile = process.env.OFFLINE_LOG_FILE_NAME || "offline-logs.txt";

  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      message,
      context
    }) + "\n";

    await Filesystem.appendFile({
      path: this.logFile,
      data: entry,
      directory: Directory.Data
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
      return fileContent.split('\n').filter(Boolean).map(line => JSON.parse(line) as ParsedLogEntry);
    } catch {
      return [];
    }
  }

  async clearLogs() {
    await Filesystem.writeFile({
      path: this.logFile,
      data: '',
      directory: Directory.Data
    });
  }
}
