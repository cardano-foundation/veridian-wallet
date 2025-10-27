import { ILogger, ParsedLogEntry } from "../ILogger";
import { ICloudLogger } from "../ICloudLogger";

export class HybridStrategy implements ILogger {
  constructor(private local?: ILogger, private cloud?: ICloudLogger) {}

  async log(logEntry: ParsedLogEntry) {
    if (this.cloud) {
      try {
        await this.cloud.log(logEntry);
      } catch {
        if (this.local) {
          await this.local.log(logEntry);
        }
      }
    } else if (this.local) {
      await this.local.log(logEntry);
    }
  }
}
