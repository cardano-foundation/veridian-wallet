import { useEffect } from "react";
import { Network } from "@capacitor/network";
import { PluginListenerHandle } from "@capacitor/core";
import { LocalFileStrategy } from "../utils/logger/strategies/LocalFileStrategy";
import { RemoteSigNozStrategy } from "../utils/logger/strategies/RemoteSigNozStrategy";
import { ParsedLogEntry } from "../utils/logger/ILogger";

export const useSigNozLogSync = () => {
  useEffect(() => {
    const syncLogs = async () => {
      const status = await Network.getStatus();
      if (status.connected) {
        const local = new LocalFileStrategy();
        const remote = new RemoteSigNozStrategy("https://signoz-server:4318/v1/logs");
        const pending: ParsedLogEntry[] = await local.readLogs();
        for (const log of pending) {
          await remote.log(log.level, log.message, log.context);
        }
        await local.clearLogs();
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
