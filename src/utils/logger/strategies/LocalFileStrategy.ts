import { Salter } from "signify-ts";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { ILogger, LogLevel, ParsedLogEntry } from "../ILogger";
import { loggingConfig } from "../LoggingConfig";

export class LocalFileStrategy implements ILogger {
  private logFile = loggingConfig.offlineLogFileName;

  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry = JSON.stringify({
      id: new Salter({}).qb64,
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
      return fileContent.split("\n").filter(Boolean).map(line => JSON.parse(line) as ParsedLogEntry);
    } catch {
      return [];
    }
  }

  async clearLogs() {
    await Filesystem.writeFile({
      path: this.logFile,
      data: "",
      directory: Directory.Data
    });
  }

  async writeLogs(logEntries: ParsedLogEntry[]) {
    const data = logEntries.map(entry => JSON.stringify(entry)).join("\n") + (logEntries.length > 0 ? "\n" : "");
    await Filesystem.writeFile({
      path: this.logFile,
      data: data,
      directory: Directory.Data
    });
  }
}
