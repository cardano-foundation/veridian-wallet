import { ILogger, ParsedLogEntry } from "../ILogger";

export class ConsoleStrategy implements ILogger {
  async log(logEntry: ParsedLogEntry) {
    const { level, message, context, ts } = logEntry;
    const logMessage = `[${ts}] [${level.toUpperCase()}] ${message}`;

    const args = context !== undefined ? [logMessage, context] : [logMessage];

    switch (level) {
      case "debug":
        // eslint-disable-next-line no-console
        console.debug(...args);
        break;
      case "info":
        // eslint-disable-next-line no-console
        console.info(...args);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(...args);
        break;
      case "error":
        // eslint-disable-next-line no-console
        console.error(...args);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(...args);
    }
  }
}
