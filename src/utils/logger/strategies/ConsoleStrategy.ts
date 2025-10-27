import { ILogger, ParsedLogEntry } from "../ILogger";

export class ConsoleStrategy implements ILogger {
  async log(logEntry: ParsedLogEntry) {
    const { level, message, context, ts } = logEntry;
    const logMessage = `[${ts}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case "debug":
        // eslint-disable-next-line no-console
        console.debug(logMessage, context);
        break;
      case "info":
        // eslint-disable-next-line no-console
        console.info(logMessage, context);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(logMessage, context);
        break;
      case "error":
        // eslint-disable-next-line no-console
        console.error(logMessage, context);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(logMessage, context);
    }
  }
}
