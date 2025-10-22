import { ILogger, LogLevel, ParsedLogEntry } from "../ILogger";

export class RemoteSigNozStrategy implements ILogger {
  constructor(private otlpEndpoint: string) {}

  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    await this.logBatch([{ ts: new Date().toISOString(), level, message, context }]);
  }

  async logBatch(logEntries: ParsedLogEntry[]) {
    if (logEntries.length === 0) {
      return;
    }

    const resourceLogs = [{
      resource: { attributes: [{ key: "service.name", value: { stringValue: "mobile-app" } }] },
      scopeLogs: [{
        logRecords: logEntries.map(entry => ({
          timeUnixNano: new Date(entry.ts).getTime() * 1e6,
          severityText: entry.level.toUpperCase(),
          body: { stringValue: entry.message },
          attributes: Object.entries(entry.context || {}).map(([k, v]) => ({ key: k, value: { stringValue: String(v) } }))
        }))
      }]
    }];

    await fetch(this.otlpEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceLogs })
    });
  }
}
