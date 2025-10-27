import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { LoggerProvider, BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { defaultResource, resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { SeverityNumber, AnyValueMap } from "@opentelemetry/api-logs";
import { LogLevel, ParsedLogEntry } from "../ILogger";
import { CloudLoggingAdapter } from "./CloudLoggingAdapter";

export class RemoteSigNozStrategy extends CloudLoggingAdapter {
  private loggerProvider: LoggerProvider;
  private exporter: OTLPLogExporter;

  constructor(otlpEndpoint: string) {
    super();
    const resource = defaultResource().merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: "<service_name>",
        [ATTR_SERVICE_VERSION]: "1.2.0",
      })
    );

    this.exporter = new OTLPLogExporter({
        url: otlpEndpoint,
        headers: {
            "signoz-ingestion-key": "<your-ingestion-key>",
          },
    });

    const processor = new BatchLogRecordProcessor(this.exporter);

    this.loggerProvider = new LoggerProvider({
      resource: resource,
      processors: [processor],
    });
  }

  private mapLogLevel(level: LogLevel): SeverityNumber {
    switch (level) {
      case "error":
        return SeverityNumber.ERROR;
      case "warn":
        return SeverityNumber.WARN;
      case "info":
        return SeverityNumber.INFO;
      case "debug":
        return SeverityNumber.DEBUG;
      default:
        return SeverityNumber.UNSPECIFIED;
    }
  }

  async logBatch(logEntries: ParsedLogEntry[]): Promise<void> {
    if (logEntries.length === 0) {
      return;
    }

    const logger = this.loggerProvider.getLogger("veridian-wallet-logger");

    for (const entry of logEntries) {
        logger.emit({
            severityNumber: this.mapLogLevel(entry.level),
            severityText: entry.level,
            body: entry.message,
            timestamp: new Date(entry.ts).getTime(),
            attributes: this.sanitizeAttributes(entry.context),
        });
    }

    await this.loggerProvider.forceFlush();
  }

  private sanitizeAttributes(context: Record<string, unknown> | undefined): AnyValueMap {
    if (!context) return {};
    const sanitized: AnyValueMap = {};
    for (const [key, value] of Object.entries(context)) {
        sanitized[key] = String(value);
    }
    return sanitized;
  }
}
