import { ILogger, LogLevel } from "../ILogger";

export class RemoteSigNozStrategy implements ILogger {
  constructor(private otlpEndpoint: string) {}

  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    await fetch(this.otlpEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceLogs: [{
          resource: { attributes: [{ key: "service.name", value: { stringValue: "mobile-app" } }] },
          scopeLogs: [{
            logRecords: [{
              timeUnixNano: Date.now() * 1e6,
              severityText: level.toUpperCase(),
              body: { stringValue: message },
              attributes: Object.entries(context || {}).map(([k, v]) => ({ key: k, value: { stringValue: String(v) } }))
            }]
          }]
        }]
      })
    });
  }
}
