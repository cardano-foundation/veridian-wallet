import { OperationRetryManager } from "./operationRetryManager";

const now = new Date("2026-01-01T00:00:00Z");
jest.useFakeTimers();

const RETRY_INTERVAL_MS = 5 * 60 * 1000;

const OperationPendingStorageMock = {
  update: jest.fn(),
  findAllByQuery: jest.fn(),
  deleteById: jest.fn(),
};

const createMockOperation = (
  id: string,
  attempts = 0,
  lastAttempt?: number
) => {
  return {
    id,
    recordType: "testType",
    retryData: attempts
      ? {
          attempts,
          lastAttempt: lastAttempt ?? now.getTime() - 60000,
          lastError: "Some error",
        }
      : undefined,
  } as any;
};

let operationRetryManager: OperationRetryManager;

beforeEach(() => {
  jest.clearAllMocks();

  jest.setSystemTime(now.getTime());

  operationRetryManager = new OperationRetryManager(
    OperationPendingStorageMock as any
  );
});

describe("Initialization", () => {
  test("should start with shouldFetchFromStorage set to true (to force initial load)", () => {
    expect(operationRetryManager.shouldFetchFromStorage()).toBe(true);
  });
});

describe("confirmRetriesFetched", () => {
  test("should reset the fetch flag so subsequent checks return false", () => {
    operationRetryManager.confirmRetriesFetched();

    expect(operationRetryManager.shouldFetchFromStorage()).toBe(false);
  });

  test("should update the last fetch timestamp", async () => {
    operationRetryManager.confirmRetriesFetched();

    const mockOp = createMockOperation("op.1");
    await operationRetryManager.scheduleRetry(mockOp, new Error("err"));

    jest.advanceTimersByTime(1000);
    expect(operationRetryManager.shouldFetchFromStorage()).toBe(false);

    jest.advanceTimersByTime(RETRY_INTERVAL_MS);
    expect(operationRetryManager.shouldFetchFromStorage()).toBe(true);
  });
});

describe("scheduleRetry", () => {
  test("should update operation in storage with incremented attempts", async () => {
    const mockOperation = createMockOperation("op.1", 2);
    const error = new Error("Some error");

    await operationRetryManager.scheduleRetry(mockOperation, error);

    expect(OperationPendingStorageMock.update).toHaveBeenCalledWith({
      ...mockOperation,
      retryData: {
        attempts: 3,
        lastAttempt: now.getTime(),
        lastError: "Some error",
      },
    });
  });

  test("should set the internal flag to true to allow future fetching", async () => {
    operationRetryManager.confirmRetriesFetched();
    expect(operationRetryManager.shouldFetchFromStorage()).toBe(false);

    jest.advanceTimersByTime(RETRY_INTERVAL_MS + 1000);
    expect(operationRetryManager.shouldFetchFromStorage()).toBe(false);

    const mockOperation = createMockOperation("op.1", 0);
    await operationRetryManager.scheduleRetry(mockOperation, new Error("err"));

    expect(operationRetryManager.shouldFetchFromStorage()).toBe(true);
  });
});

describe("Timing Logic Integration", () => {
  test("should only return true when BOTH flag is true and time has passed", async () => {
    operationRetryManager.confirmRetriesFetched();

    jest.advanceTimersByTime(RETRY_INTERVAL_MS + 1000);
    expect(operationRetryManager.shouldFetchFromStorage()).toBe(false);

    await operationRetryManager.scheduleRetry(
      createMockOperation("1"),
      new Error("e")
    );

    operationRetryManager.confirmRetriesFetched();
    await operationRetryManager.scheduleRetry(
      createMockOperation("1"),
      new Error("e")
    );

    jest.advanceTimersByTime(60 * 1000);
    expect(operationRetryManager.shouldFetchFromStorage()).toBe(false);

    jest.advanceTimersByTime(RETRY_INTERVAL_MS);
    expect(operationRetryManager.shouldFetchFromStorage()).toBe(true);
  });
});
