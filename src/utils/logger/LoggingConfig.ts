import { LogLevel } from "./ILogger";

interface ILoggingConfig {
  mode: LogLevel | "off";
  consoleEnabled: boolean;
  localEnabled: boolean;
  remoteEnabled: boolean;
  signozOtlpEndpoint: string;
  offlineLogFileName: string;
  batchSize: number;
  maxSyncRetries: number;
  retryDelayMs: number;
}

export class LoggingConfig implements ILoggingConfig {
  public readonly mode: LogLevel | "off";
  public readonly consoleEnabled: boolean;
  public readonly localEnabled: boolean;
  public readonly remoteEnabled: boolean;
  public readonly signozOtlpEndpoint: string;
  public readonly offlineLogFileName: string;
  public readonly batchSize: number;
  public readonly maxSyncRetries: number;
  public readonly retryDelayMs: number;

  constructor() {
    this.mode = (process.env.LOGGING_MODE as LogLevel | "off") || "info";
    this.consoleEnabled = process.env.LOGGING_CONSOLE_ENABLED === "true";
    this.localEnabled = process.env.LOGGING_LOCAL_ENABLED === "true";
    this.remoteEnabled = process.env.LOGGING_REMOTE_ENABLED === "true";
    this.signozOtlpEndpoint = process.env.SIGNOZ_OTLP_ENDPOINT || "https://signoz-server:4318/v1/logs";
    this.offlineLogFileName = process.env.OFFLINE_LOG_FILE_NAME || "offline-logs.txt";
    const parsedBatchSize = parseInt(process.env.LOGGING_BATCH_SIZE || "50", 10);
    this.batchSize = isNaN(parsedBatchSize) ? 50 : parsedBatchSize;
    const parsedMaxSyncRetries = parseInt(process.env.LOGGING_MAX_SYNC_RETRIES || "3", 10);
    this.maxSyncRetries = isNaN(parsedMaxSyncRetries) ? 3 : parsedMaxSyncRetries;
    const parsedRetryDelayMs = parseInt(process.env.LOGGING_RETRY_DELAY_MS || "5000", 10);
    this.retryDelayMs = isNaN(parsedRetryDelayMs) ? 5000 : parsedRetryDelayMs;

    // Override individual enables if mode is "off"
    if (this.mode === "off") {
      this.consoleEnabled = false;
      this.localEnabled = false;
      this.remoteEnabled = false;
    }
  }
}

export const loggingConfig = new LoggingConfig();
