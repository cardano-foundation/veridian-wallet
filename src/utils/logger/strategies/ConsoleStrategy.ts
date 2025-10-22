import { ILogger, LogLevel } from "../ILogger";

export class ConsoleStrategy implements ILogger {
  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

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
