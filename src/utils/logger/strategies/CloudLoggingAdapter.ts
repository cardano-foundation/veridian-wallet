import { ILogger, ParsedLogEntry } from "../ILogger";
import { ICloudLogger } from "../ICloudLogger";

export abstract class CloudLoggingAdapter implements ILogger, ICloudLogger {
  protected logQueue: ParsedLogEntry[] = [];
  protected flushInterval: NodeJS.Timeout | null = null;
  protected readonly BATCH_SIZE = 10; // Example batch size
  protected readonly FLUSH_INTERVAL_MS = 5000; // Example flush interval

  constructor() {
    this.startFlushInterval();
  }

  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
  }

  async log(logEntry: ParsedLogEntry): Promise<void> {
    this.logQueue.push(logEntry);

    if (this.logQueue.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  abstract logBatch(logEntries: ParsedLogEntry[]): Promise<void>;

  async flush(): Promise<void> {
    if (this.logQueue.length > 0) {
      const batch = [...this.logQueue];
      this.logQueue = [];
      await this.logBatch(batch);
    }
  }

  public stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}
