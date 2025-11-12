import { Network } from "@capacitor/network";
import { PluginListenerHandle } from "@capacitor/core";
import { LocalFileStrategy } from "../../utils/logger/strategies/LocalFileStrategy";
import { SigNozProvider } from "../../utils/logger/providers/SigNozProvider";
import { ParsedLogEntry } from "../../utils/logger/ILogger";
import { loggingConfig } from "../../utils/logger/LoggingConfig";
import { logger } from "../../utils/logger/Logger";
import { Agent } from '../agent/agent';
import { BasicRecord } from '../agent/records';

export enum SyncMode {
  Auto = "auto",
  Manual = "manual",
}

export class LogSyncService {
  private listener: PluginListenerHandle | undefined;
  private localStrategyFactory: () => LocalFileStrategy;
  private remoteStrategyFactory: (otlpEndpoint: string, ingestionKey: string) => SigNozProvider;
  private delay: (ms: number) => Promise<void>;
  public syncMode: SyncMode;

  constructor(
    localStrategyFactory: () => LocalFileStrategy = () => new LocalFileStrategy(),
    remoteStrategyFactory: (otlpEndpoint: string, ingestionKey: string) => SigNozProvider =
      (otlpEndpoint, ingestionKey) => new SigNozProvider(otlpEndpoint, ingestionKey),
    delay: (ms: number) => Promise<void> = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    syncMode: SyncMode = SyncMode.Manual
  ) {
    this.localStrategyFactory = localStrategyFactory;
    this.remoteStrategyFactory = remoteStrategyFactory;
    this.delay = delay;
    this.syncMode = syncMode;
  }

  public async start(): Promise<void> {
    if (this.syncMode === SyncMode.Auto) {
      await this.syncLogs();
      this.listener = await Network.addListener("networkStatusChange", () => this.syncLogs());
    }
  }

  public stop(): void {
    if (this.listener) {
      this.listener.remove();
      this.listener = undefined;
    }
  }

  public setSyncMode(mode: SyncMode): void {
    this.syncMode = mode;
  }

    public async syncLogs(): Promise<void> {

      if (!loggingConfig.remoteEnabled) {

        return;

      }

  

      const status = await Network.getStatus();

      if (!status.connected) {

        return;

      }

  

      try {

        if (loggingConfig.signozOtlpEndpoint && loggingConfig.signozIngestionKey) {

          const local = this.localStrategyFactory();

          const remote = this.remoteStrategyFactory(

            loggingConfig.signozOtlpEndpoint,

            loggingConfig.signozIngestionKey,

          );

  

          // Read last synced log ID from Agent's basic storage

          const LAST_SYNCED_LOG_ID_KEY = 'lastSyncedLogIdRecord'; // Using a string literal for the record ID

          const lastSyncedRecord = await Agent.agent.basicStorage.findById(LAST_SYNCED_LOG_ID_KEY);

          const lastSyncedLogId: string | null = lastSyncedRecord ? (lastSyncedRecord.content as { lastSyncedLogId: string }).lastSyncedLogId : null;

  

          // Read all logs from local storage

          const allLogs: ParsedLogEntry[] = await local.readLogs();

  

          if (allLogs.length === 0) {

            return; // Nothing to sync

          }

  

          let logsToSync: ParsedLogEntry[] = allLogs;

          if (lastSyncedLogId) {

            // Find the index of the last synced log. Logs are assumed to be in order.

            const lastSyncedIndex = allLogs.findIndex(log => log.id === lastSyncedLogId);

            if (lastSyncedIndex > -1) {

              logsToSync = allLogs.slice(lastSyncedIndex + 1);

            }

          }

  

          if (logsToSync.length === 0) {

            logger.debug("All logs already synced.", undefined, true);

            return; // All logs have been synced

          }

  

          // Process and send logs in batches

          for (let i = 0; i < logsToSync.length; i += loggingConfig.batchSize) {

            const batch = logsToSync.slice(i, i + loggingConfig.batchSize);

            if (batch.length === 0) {

              continue;

            }

  

            await remote.logBatch(batch);

  

            // On successful send, update and persist the ID of the last log in the batch.

            const newLastSyncedLogId = batch[batch.length - 1].id;

            await Agent.agent.basicStorage.createOrUpdateBasicRecord(

              new BasicRecord({

                id: LAST_SYNCED_LOG_ID_KEY,

                content: { lastSyncedLogId: newLastSyncedLogId },

              })

            );

          }

  

          logger.debug("Logs sync completed successfully.", undefined, true);

        }

      } catch (error) {

        // Log the error. The next sync attempt will retry from the last successful sync point.

        logger.error("Log sync failed. Will retry on next occasion.", { error });

      }

    }
}

export const logSyncService = new LogSyncService();