export interface ILogger {
  log(logEntry: ParsedLogEntry): Promise<void>;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ParsedLogEntry {
  id: string;
  ts: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}
