import { ILogger, ParsedLogEntry } from "../ILogger";
import { ICloudLogger } from "../ICloudLogger";

/**
 * `CloudLoggingAdapter` is an abstract base class for implementing cloud-based logging strategies.
 * It provides a generic mechanism for batching log entries and sending them to a cloud service periodically or when the batch size is reached.
 *
 * To create a new cloud logging provider, you should:
 * 1. Extend this class.
 * 2. Implement the `logBatch` method, which is responsible for sending a batch of log entries to the specific cloud service.
 *
 * This design decouples the core logging logic from the specifics of any single cloud provider, making it easy to integrate with services
 * like SigNoz, Datadog, or others by creating a new adapter.
 */
export abstract class CloudLoggingAdapter implements ILogger, ICloudLogger {
  // Queue to hold log entries before they are sent.
  protected logQueue: ParsedLogEntry[] = [];
  // Timer for periodically flushing the log queue.
  protected flushInterval: NodeJS.Timeout | null = null;
  // Number of logs to batch before sending.
  protected readonly BATCH_SIZE = 10; // Example batch size
  // Time in milliseconds to wait before sending a batch.
  protected readonly FLUSH_INTERVAL_MS = 5000; // Example flush interval

  constructor() {
    this.startFlushInterval();
  }

  // Starts a timer to periodically flush the log queue.
  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
  }

  /**
   * Adds a log entry to the queue and triggers a flush if the batch size is reached.
   * @param logEntry The log entry to be added to the queue.
   */
  async log(logEntry: ParsedLogEntry): Promise<void> {
    this.logQueue.push(logEntry);

    if (this.logQueue.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Abstract method to be implemented by subclasses.
   * This method should contain the logic for sending a batch of log entries to the specific cloud provider.
   * @param logEntries An array of log entries to be sent.
   */
  abstract logBatch(logEntries: ParsedLogEntry[]): Promise<void>;

  /**
   * Flushes the log queue by sending all pending log entries in a batch.
   */
  async flush(): Promise<void> {
    if (this.logQueue.length > 0) {
      const batch = [...this.logQueue];
      this.logQueue = [];
      await this.logBatch(batch);
    }
  }

  /**
   * Stops the periodic flushing of the log queue.
   * This should be called when the logger is no longer needed to prevent memory leaks.
   */
  public stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}
