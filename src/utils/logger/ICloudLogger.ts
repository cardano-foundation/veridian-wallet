import { ILogger, ParsedLogEntry } from "./ILogger";

export interface ICloudLogger extends ILogger {
  logBatch(logEntries: ParsedLogEntry[]): Promise<void>;
  flush(): Promise<void>;
}
