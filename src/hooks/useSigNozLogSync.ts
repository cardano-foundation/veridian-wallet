import { useEffect } from "react";
import { Network } from "@capacitor/network";
import { PluginListenerHandle } from "@capacitor/core";
import { LocalFileStrategy } from "../utils/logger/strategies/LocalFileStrategy";
import { RemoteSigNozStrategy } from "../utils/logger/strategies/RemoteSigNozStrategy";
import { ParsedLogEntry } from "../utils/logger/ILogger";
import { loggingConfig } from "../utils/logger/LoggingConfig";
import { useLogger } from "../context/LoggerContext";

export const useSigNozLogSync = (
  localStrategyFactory: () => LocalFileStrategy = () => new LocalFileStrategy(),
  remoteStrategyFactory: (otlpEndpoint: string) => RemoteSigNozStrategy = (otlpEndpoint) => new RemoteSigNozStrategy(otlpEndpoint)
) => {
  const logger = useLogger();

  useEffect(() => {
    const syncLogs = async () => {
      if (!loggingConfig.localEnabled || !loggingConfig.remoteEnabled) {
        return; // Only sync if both local and remote are enabled
      }

      const status = await Network.getStatus();
      if (!status.connected) {
        return; // No network connection, try again later
      }

      for (let attempt = 1; attempt <= loggingConfig.maxSyncRetries; attempt++) {
        try {
          const local = localStrategyFactory();
          const remote = remoteStrategyFactory(loggingConfig.signozOtlpEndpoint);
          const pending: ParsedLogEntry[] = await local.readLogs();
          const successfullySentLogIds = new Set<string>();

          if (pending.length === 0) {
            return; // No logs to sync
          }

          for (let i = 0; i < pending.length; i += loggingConfig.batchSize) {
            const batch = pending.slice(i, i + loggingConfig.batchSize);
            await remote.logBatch(batch);
            batch.forEach(log => successfullySentLogIds.add(log.id));
          }

          // Clear only the successfully sent logs from local storage
          if (successfullySentLogIds.size > 0) {
            const remainingLogs = pending.filter(log => !successfullySentLogIds.has(log.id));
            await local.writeLogs(remainingLogs);
          }
          return; // Sync successful, exit retry loop
        } catch (error) {
          logger.error(`Log sync attempt ${attempt} failed:`, { error, attempt });
          if (attempt < loggingConfig.maxSyncRetries) {
            await new Promise(resolve => setTimeout(resolve, loggingConfig.retryDelayMs));
          } else {
            logger.error("Max log sync retries reached. Logs will remain in local storage.");
          }
        }
      }
    };

    let listener: PluginListenerHandle | undefined;

    const setupListener = async () => {
      listener = await Network.addListener("networkStatusChange", syncLogs);
    };

    setupListener();
    syncLogs(); // initial attempt

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);
};
