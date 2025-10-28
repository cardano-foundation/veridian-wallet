import { Network } from "@capacitor/network";
import { PluginListenerHandle } from "@capacitor/core";
import { LocalFileStrategy } from "../../utils/logger/strategies/LocalFileStrategy";
import { SigNozProvider } from "../../utils/logger/providers/SigNozProvider";
import { ParsedLogEntry } from "../../utils/logger/ILogger";
import { loggingConfig } from "../../utils/logger/LoggingConfig";
import { logger } from "../../utils/logger/Logger";

export class LogSyncService {
  private listener: PluginListenerHandle | undefined;
  private localStrategyFactory: () => LocalFileStrategy;
  private remoteStrategyFactory: (otlpEndpoint: string, ingestionKey: string) => SigNozProvider;
  private delay: (ms: number) => Promise<void>;

  constructor(
    localStrategyFactory: () => LocalFileStrategy = () => new LocalFileStrategy(),
    remoteStrategyFactory: (otlpEndpoint: string, ingestionKey: string) => SigNozProvider = 
      (otlpEndpoint, ingestionKey) => new SigNozProvider(otlpEndpoint, ingestionKey),
    delay: (ms: number) => Promise<void> = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  ) {
    this.localStrategyFactory = localStrategyFactory;
    this.remoteStrategyFactory = remoteStrategyFactory;
    this.delay = delay;
  }

  public async start(): Promise<void> {
    await this.syncLogs();
    this.listener = await Network.addListener("networkStatusChange", () => this.syncLogs());
  }

  public stop(): void {
    if (this.listener) {
      this.listener.remove();
      this.listener = undefined;
    }
  }

  private async syncLogs(): Promise<void> {
    if (!loggingConfig.localEnabled || !loggingConfig.remoteEnabled) {
      return;
    }

    const status = await Network.getStatus();
    if (!status.connected) {
      return;
    }

    for (let attempt = 1; attempt <= loggingConfig.maxSyncRetries; attempt++) {
      try {
        if (loggingConfig.signozOtlpEndpoint && loggingConfig.signozIngestionKey) {
          const local = this.localStrategyFactory();
          const remote = this.remoteStrategyFactory(loggingConfig.signozOtlpEndpoint, loggingConfig.signozIngestionKey);
          const pending: ParsedLogEntry[] = await local.readLogs();
          const successfullySentLogIds = new Set<string>();
  
          if (pending.length === 0) {
            return;
          }
  
          for (let i = 0; i < pending.length; i += loggingConfig.batchSize) {
            const batch = pending.slice(i, i + loggingConfig.batchSize);
            await remote.logBatch(batch);
            batch.forEach(log => successfullySentLogIds.add(log.id));
          }
  
          if (successfullySentLogIds.size > 0) {
            const remainingLogs = pending.filter(log => !successfullySentLogIds.has(log.id));
            await local.writeLogs(remainingLogs);
          }
          return;
        }
      } catch (error) {
        logger.error(`Log sync attempt ${attempt} failed:`, { error, attempt });
        if (attempt < loggingConfig.maxSyncRetries) {
          await this.delay(loggingConfig.retryDelayMs);
        } else {
          logger.error("Max log sync retries reached. Logs will remain in local storage.");
        }
      }
    }
  }
}

export const logSyncService = new LogSyncService();