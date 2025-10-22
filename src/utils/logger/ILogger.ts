export interface ILogger {
  log(level: LogLevel, message: string, context?: Record<string, unknown>): Promise<void>;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ParsedLogEntry {
  ts: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}
