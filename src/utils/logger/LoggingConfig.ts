import { LogLevel } from "./ILogger";

interface ILoggingConfig {
  mode: LogLevel | "off";
  consoleEnabled: boolean;
  localEnabled: boolean;
  remoteEnabled: boolean;
  signozOtlpEndpoint?: string;
  signozIngestionKey?: string;
  offlineLogFileName: string;
  batchSize: number;
  maxSyncRetries: number;
  retryDelayMs: number;
  maxLogFileSize: number;
  logRetentionDays: number;
}

export class LoggingConfig implements ILoggingConfig {
  public readonly mode: LogLevel | "off";
  public readonly consoleEnabled: boolean;
  public readonly localEnabled: boolean;
  public readonly remoteEnabled: boolean;
  public readonly signozOtlpEndpoint?: string;
  public readonly signozIngestionKey?: string;
  public readonly offlineLogFileName: string;
  public readonly batchSize: number;
  public readonly maxSyncRetries: number;
  public readonly retryDelayMs: number;
  public readonly maxLogFileSize: number;
  public readonly logRetentionDays: number;

  constructor() {
    this.mode = (process.env.LOGGING_MODE as LogLevel | "off") || "info";
    this.consoleEnabled = process.env.LOGGING_CONSOLE_ENABLED === "true";
    this.localEnabled = process.env.LOGGING_LOCAL_ENABLED === "true";
    this.remoteEnabled = process.env.LOGGING_REMOTE_ENABLED === "true";
    this.offlineLogFileName =
      process.env.OFFLINE_LOG_FILE_NAME || "offline-logs.txt";
    const parsedBatchSize = parseInt(process.env.LOGGING_BATCH_SIZE || "5", 10);
    this.batchSize = isNaN(parsedBatchSize) ? 5 : parsedBatchSize;
    const parsedMaxSyncRetries = parseInt(
      process.env.LOGGING_MAX_SYNC_RETRIES || "3",
      10
    );
    this.maxSyncRetries = isNaN(parsedMaxSyncRetries)
      ? 3
      : parsedMaxSyncRetries;
    const parsedRetryDelayMs = parseInt(
      process.env.LOGGING_RETRY_DELAY_MS || "5000",
      10
    );
    this.retryDelayMs = isNaN(parsedRetryDelayMs) ? 5000 : parsedRetryDelayMs;
    const parsedMaxLogFileSize = parseInt(
      process.env.LOGGING_MAX_FILE_SIZE || String(5 * 1024 * 1024),
      10
    );
    this.maxLogFileSize = isNaN(parsedMaxLogFileSize)
      ? 5 * 1024 * 1024
      : parsedMaxLogFileSize;
    const parsedLogRetentionDays = parseInt(
      process.env.LOGGING_RETENTION_DAYS || "3",
      10
    );
    this.logRetentionDays = isNaN(parsedLogRetentionDays)
      ? 3
      : parsedLogRetentionDays;

    // Override individual enables if mode is "off"
    if (this.mode === "off") {
      this.consoleEnabled = false;
      this.localEnabled = false;
      this.remoteEnabled = false;
    }

    if (this.remoteEnabled) {
      this.signozOtlpEndpoint = process.env.SIGNOZ_OTLP_ENDPOINT;
      this.signozIngestionKey = process.env.SIGNOZ_INGESTION_KEY;

      if (!this.signozOtlpEndpoint) {
        throw new Error(
          "SIGNOZ_OTLP_ENDPOINT is required when remote logging is enabled."
        );
      }
      if (!this.signozIngestionKey?.length) {
        throw new Error(
          "SIGNOZ_INGESTION_KEY is required when remote logging is enabled."
        );
      }
    }
  }
}

export const loggingConfig = new LoggingConfig();
