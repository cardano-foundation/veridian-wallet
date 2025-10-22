import { ILogger, LogLevel } from "../ILogger";

export class HybridStrategy implements ILogger {
  constructor(private local?: ILogger, private remote?: ILogger) {}

  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (this.remote) {
      try {
        await this.remote.log(level, message, context);
      } catch {
        if (this.local) {
          await this.local.log(level, message, context);
        }
      }
    } else if (this.local) {
      await this.local.log(level, message, context);
    }
  }
}
