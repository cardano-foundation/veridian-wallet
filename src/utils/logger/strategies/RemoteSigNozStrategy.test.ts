import { Salter } from "signify-ts";
import { RemoteSigNozStrategy } from "./RemoteSigNozStrategy";
import { LogLevel, ParsedLogEntry } from "../ILogger";

// Mock signify-ts Salter
jest.mock("signify-ts", () => ({
  Salter: jest.fn().mockImplementation(() => ({
    qb64: "mocked-salter-id",
  })),
}));

describe("RemoteSigNozStrategy", () => {
  let remoteSigNozStrategy: RemoteSigNozStrategy;
  const otlpEndpoint = "http://mock-otlp-endpoint.com/v1/logs";
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn(() => Promise.resolve({ ok: true }));
    global.fetch = mockFetch;

    remoteSigNozStrategy = new RemoteSigNozStrategy(otlpEndpoint);

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("log", () => {
    it("should call logBatch with a single ParsedLogEntry", async () => {
      const level: LogLevel = "info";
      const message = "Test message";
      const context = { key: "value" };

      await remoteSigNozStrategy.log(level, message, context);

      const expectedLogEntry: ParsedLogEntry = {
        id: "mocked-salter-id",
        ts: "2023-01-01T12:00:00.000Z",
        level,
        message,
        context,
      };

      expect(Salter).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchArgs = mockFetch.mock.calls[0];
      expect(fetchArgs[0]).toBe(otlpEndpoint);
      const body = JSON.parse(fetchArgs[1].body);
      expect(body.resourceLogs[0].scopeLogs[0].logRecords[0]).toEqual({
        timeUnixNano: new Date(expectedLogEntry.ts).getTime() * 1e6,
        severityText: expectedLogEntry.level.toUpperCase(),
        body: { stringValue: expectedLogEntry.message },
        attributes: [{ key: "key", value: { stringValue: "value" } }],
      });
    });

    it("should handle log without context", async () => {
      const level: LogLevel = "debug";
      const message = "Debug message";

      await remoteSigNozStrategy.log(level, message);

      const expectedLogEntry: ParsedLogEntry = {
        id: "mocked-salter-id",
        ts: "2023-01-01T12:00:00.000Z",
        level,
        message,
        context: undefined,
      };

      expect(Salter).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchArgs[1].body);
      expect(body.resourceLogs[0].scopeLogs[0].logRecords[0]).toEqual({
        timeUnixNano: new Date(expectedLogEntry.ts).getTime() * 1e6,
        severityText: expectedLogEntry.level.toUpperCase(),
        body: { stringValue: expectedLogEntry.message },
        attributes: [], // No context, so attributes should be empty
      });
    });
  });

  describe("logBatch", () => {
    it("should not call fetch if logEntries is empty", async () => {
      await remoteSigNozStrategy.logBatch([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should call fetch with the correct payload for multiple log entries", async () => {
      const logEntry1: ParsedLogEntry = {
        id: "uuid-1",
        ts: "2023-01-01T10:00:00.000Z",
        level: "info",
        message: "Log 1",
        context: { user: "test1" },
      };
      const logEntry2: ParsedLogEntry = {
        id: "uuid-2",
        ts: "2023-01-01T11:00:00.000Z",
        level: "warn",
        message: "Log 2",
        context: { user: "test2", status: "pending" },
      };
      const logEntries = [logEntry1, logEntry2];

      await remoteSigNozStrategy.logBatch(logEntries);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchArgs = mockFetch.mock.calls[0];
      expect(fetchArgs[0]).toBe(otlpEndpoint);
      const body = JSON.parse(fetchArgs[1].body);

      expect(body.resourceLogs[0].scopeLogs[0].logRecords).toHaveLength(2);
      expect(body.resourceLogs[0].scopeLogs[0].logRecords[0]).toEqual({
        timeUnixNano: new Date(logEntry1.ts).getTime() * 1e6,
        severityText: logEntry1.level.toUpperCase(),
        body: { stringValue: logEntry1.message },
        attributes: [{ key: "user", value: { stringValue: "test1" } }],
      });
      expect(body.resourceLogs[0].scopeLogs[0].logRecords[1]).toEqual({
        timeUnixNano: new Date(logEntry2.ts).getTime() * 1e6,
        severityText: logEntry2.level.toUpperCase(),
        body: { stringValue: logEntry2.message },
        attributes: [
          { key: "user", value: { stringValue: "test2" } },
          { key: "status", value: { stringValue: "pending" } },
        ],
      });
    });

    it("should handle fetch errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Expect the promise to resolve, not reject, as the strategy handles the error internally
      await expect(remoteSigNozStrategy.logBatch([{
        id: "uuid",
        ts: "2023-01-01T12:00:00.000Z",
        level: "error",
        message: "Error log",
      }])).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
