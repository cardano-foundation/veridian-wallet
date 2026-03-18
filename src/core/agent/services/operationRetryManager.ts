import { OperationPendingRecord } from "../records/operationPendingRecord";
import { OperationPendingStorage } from "../records";

export class OperationRetryManager {
  private readonly operationPendingStorage: OperationPendingStorage;

  private readonly RETRY_FETCH_INTERVAL = 5 * 60 * 1000;

  private _hasNewRetries = true;
  private _lastRetryFetchTime = 0;

  constructor(operationPendingStorage: OperationPendingStorage) {
    this.operationPendingStorage = operationPendingStorage;
  }

  public shouldFetchFromStorage(): boolean {
    if (!this._hasNewRetries) return false;

    const now = Date.now();
    return now - this._lastRetryFetchTime > this.RETRY_FETCH_INTERVAL;
  }

  public confirmRetriesFetched(): void {
    this._hasNewRetries = false;
    this._lastRetryFetchTime = Date.now();
  }

  public async scheduleRetry(
    operation: OperationPendingRecord,
    error: Error
  ): Promise<void> {
    const currentAttempts = operation.retryData?.attempts ?? 0;

    operation.retryData = {
      attempts: currentAttempts + 1,
      lastAttempt: Date.now(),
      lastError: error.message,
    };

    await this.operationPendingStorage.update(operation);
    this._hasNewRetries = true;

    /* eslint-disable no-console */
    console.warn(
      `Operation scheduled for retry. ID: ${operation.id}, Type: ${operation.recordType}, Attempts: ${operation.retryData.attempts}, Error: ${error.message}`
    );
  }
}
