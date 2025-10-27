import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { RemoteSigNozStrategy } from './RemoteSigNozStrategy';
import { ParsedLogEntry } from '../ILogger';
import { SeverityNumber, AnyValueMap } from '@opentelemetry/api-logs';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes, defaultResource } from '@opentelemetry/resources';

// Mock the OTel classes
jest.mock('@opentelemetry/exporter-logs-otlp-http');
jest.mock('@opentelemetry/sdk-logs');
jest.mock('@opentelemetry/resources', () => ({
  ...jest.requireActual('@opentelemetry/resources'),
  defaultResource: jest.fn().mockReturnValue({
    merge: jest.fn().mockReturnThis(),
  }),
  resourceFromAttributes: jest.fn((attributes) => ({ attributes })),
}));
jest.mock('@opentelemetry/semantic-conventions');

describe('RemoteSigNozStrategy', () => {
  let strategy: RemoteSigNozStrategy;
  const mockOtlpEndpoint = 'http://test-endpoint.com/v1/logs';

  let mockLogger: {
    emit: jest.Mock;
  };
  let mockLoggerProvider: {
    getLogger: jest.Mock;
    forceFlush: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks for OTel classes
    mockLogger = {
      emit: jest.fn(),
    };
    mockLoggerProvider = {
      getLogger: jest.fn().mockReturnValue(mockLogger),
      forceFlush: jest.fn().mockResolvedValue(undefined),
    } as any;

    (LoggerProvider as jest.Mock).mockImplementation(() => mockLoggerProvider);
    (OTLPLogExporter as jest.Mock).mockClear();
    (BatchLogRecordProcessor as jest.Mock).mockClear();

    strategy = new RemoteSigNozStrategy(mockOtlpEndpoint);
  });

  it('should initialize the OTLPLogExporter and LoggerProvider correctly', () => {
    expect(OTLPLogExporter).toHaveBeenCalledWith({
      url: mockOtlpEndpoint,
      headers: {
        'signoz-ingestion-key': '<your-ingestion-key>',
      },
    });
    
    expect(LoggerProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        processors: [expect.any(BatchLogRecordProcessor)],
      })
    );
    expect(defaultResource).toHaveBeenCalled();
    expect(resourceFromAttributes).toHaveBeenCalled();
  });

  it('logBatch should do nothing for empty log entries', async () => {
    await strategy.logBatch([]);
    expect(mockLoggerProvider.getLogger).not.toHaveBeenCalled();
  });

  it('logBatch should transform and emit log entries', async () => {
    const logEntries: ParsedLogEntry[] = [
      {
        id: '1',
        ts: new Date().toISOString(),
        level: 'info',
        message: 'Info message',
        context: { userId: 'user1' },
      },
      {
        id: '2',
        ts: new Date().toISOString(),
        level: 'error',
        message: 'Error message',
        context: { error: 'stacktrace' },
      },
    ];

    await strategy.logBatch(logEntries);

    expect(mockLoggerProvider.getLogger).toHaveBeenCalledWith('veridian-wallet-logger');
    expect(mockLogger.emit).toHaveBeenCalledTimes(2);

    // Check first log entry
    expect(mockLogger.emit).toHaveBeenCalledWith(expect.objectContaining({
      severityNumber: SeverityNumber.INFO,
      severityText: 'info',
      body: 'Info message',
      attributes: { userId: 'user1' },
    }));

    // Check second log entry
    expect(mockLogger.emit).toHaveBeenCalledWith(expect.objectContaining({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'error',
      body: 'Error message',
      attributes: { error: 'stacktrace' },
    }));
  });

  it('logBatch should call forceFlush after emitting logs', async () => {
    const logEntries: ParsedLogEntry[] = [
      {
        id: '1',
        ts: new Date().toISOString(),
        level: 'info',
        message: 'Info message',
      },
    ];

    await strategy.logBatch(logEntries);

    expect(mockLogger.emit).toHaveBeenCalledTimes(1);
    expect(mockLoggerProvider.forceFlush).toHaveBeenCalledTimes(1);
  });

  it('log should queue the log entry and flush should call logBatch', async () => {
    const logEntry: ParsedLogEntry = {
      id: '1',
      ts: new Date().toISOString(),
      level: 'info',
      message: 'Info message',
      context: { userId: 'user1' },
    };

    // Mock logBatch to track calls
    const logBatchSpy = jest.spyOn(strategy, 'logBatch');

    await strategy.log(logEntry);

    // Expect log entry to be in the queue
    expect((strategy as any).logQueue).toEqual([logEntry]);

    // Manually flush the strategy
    await strategy.flush();

    // Expect logBatch to have been called with the queued entry
    expect(logBatchSpy).toHaveBeenCalledTimes(1);
    expect(logBatchSpy).toHaveBeenCalledWith([logEntry]);

    // Expect the queue to be empty after flush
    expect((strategy as any).logQueue).toEqual([]);
  });
});
