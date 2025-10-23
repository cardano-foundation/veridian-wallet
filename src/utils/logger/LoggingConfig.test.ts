import { LoggingConfig } from "./LoggingConfig";

describe('LoggingConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clears the cache for modules, so we can modify process.env
    process.env = { ...originalEnv }; // Make a copy of the original env
    delete process.env.LOGGING_MODE;
    delete process.env.LOGGING_CONSOLE_ENABLED;
    delete process.env.LOGGING_LOCAL_ENABLED;
    delete process.env.LOGGING_REMOTE_ENABLED;
    delete process.env.SIGNOZ_OTLP_ENDPOINT;
    delete process.env.OFFLINE_LOG_FILE_NAME;
    delete process.env.LOGGING_BATCH_SIZE;
    delete process.env.LOGGING_MAX_SYNC_RETRIES;
    delete process.env.LOGGING_RETRY_DELAY_MS;
  });

  afterAll(() => {
    process.env = originalEnv; // Restore original env
  });

  it('should load default values when no environment variables are set', () => {
    const config = new LoggingConfig();
    expect(config.mode).toBe('info');
    expect(config.consoleEnabled).toBe(false);
    expect(config.localEnabled).toBe(false);
    expect(config.remoteEnabled).toBe(false);
    expect(config.signozOtlpEndpoint).toBe('https://signoz-server:4318/v1/logs');
    expect(config.offlineLogFileName).toBe('offline-logs.txt');
    expect(config.batchSize).toBe(50);
    expect(config.maxSyncRetries).toBe(3);
    expect(config.retryDelayMs).toBe(5000);
  });

  it('should load values from environment variables', () => {
    process.env.LOGGING_MODE = 'debug';
    process.env.LOGGING_CONSOLE_ENABLED = 'true';
    process.env.LOGGING_LOCAL_ENABLED = 'true';
    process.env.LOGGING_REMOTE_ENABLED = 'true';
    process.env.SIGNOZ_OTLP_ENDPOINT = 'http://custom-signoz:4318/v1/logs';
    process.env.OFFLINE_LOG_FILE_NAME = 'custom-logs.txt';
    process.env.LOGGING_BATCH_SIZE = '100';
    process.env.LOGGING_MAX_SYNC_RETRIES = '5';
    process.env.LOGGING_RETRY_DELAY_MS = '10000';

    const config = new LoggingConfig();
    expect(config.mode).toBe('debug');
    expect(config.consoleEnabled).toBe(true);
    expect(config.localEnabled).toBe(true);
    expect(config.remoteEnabled).toBe(true);
    expect(config.signozOtlpEndpoint).toBe('http://custom-signoz:4318/v1/logs');
    expect(config.offlineLogFileName).toBe('custom-logs.txt');
    expect(config.batchSize).toBe(100);
    expect(config.maxSyncRetries).toBe(5);
    expect(config.retryDelayMs).toBe(10000);
  });

  it('should disable all enables if LOGGING_MODE is off', () => {
    process.env.LOGGING_MODE = 'off';
    process.env.LOGGING_CONSOLE_ENABLED = 'true';
    process.env.LOGGING_LOCAL_ENABLED = 'true';
    process.env.LOGGING_REMOTE_ENABLED = 'true';

    const config = new LoggingConfig();
    expect(config.mode).toBe('off');
    expect(config.consoleEnabled).toBe(false);
    expect(config.localEnabled).toBe(false);
    expect(config.remoteEnabled).toBe(false);
  });

  it('should handle invalid numeric environment variables gracefully', () => {
    process.env.LOGGING_BATCH_SIZE = 'abc';
    process.env.LOGGING_MAX_SYNC_RETRIES = 'xyz';
    process.env.LOGGING_RETRY_DELAY_MS = 'def';

    const config = new LoggingConfig();
    expect(config.batchSize).toBe(50); // Should fall back to default
    expect(config.maxSyncRetries).toBe(3); // Should fall back to default
    expect(config.retryDelayMs).toBe(5000); // Should fall back to default
  });
});
