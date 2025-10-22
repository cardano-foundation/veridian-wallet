import { ILogger, LogLevel } from "./ILogger";
import { LocalFileStrategy } from "./strategies/LocalFileStrategy";
import { RemoteSigNozStrategy } from "./strategies/RemoteSigNozStrategy";
import { HybridStrategy } from "./strategies/HybridStrategy";
import { ConsoleStrategy } from "./strategies/ConsoleStrategy";

class Logger {
  private static instance: Logger;
  private strategies: ILogger[];

  private constructor(strategies: ILogger[]) {
    this.strategies = strategies;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      const activeStrategies: ILogger[] = [];

      const consoleEnabled = process.env.LOGGING_CONSOLE_ENABLED === "true";
      const localEnabled = process.env.LOGGING_LOCAL_ENABLED === "true";
      const remoteEnabled = process.env.LOGGING_REMOTE_ENABLED === "true";
      const signozOtlpEndpoint = process.env.SIGNOZ_OTLP_ENDPOINT || "https://signoz-server:4318/v1/logs";

      if (consoleEnabled) {
        activeStrategies.push(new ConsoleStrategy());
      }

      let localStrategy: LocalFileStrategy | undefined;
      if (localEnabled) {
        localStrategy = new LocalFileStrategy();
      }

      let remoteStrategy: RemoteSigNozStrategy | undefined;
      if (remoteEnabled) {
        remoteStrategy = new RemoteSigNozStrategy(signozOtlpEndpoint);
      }

      if (localStrategy && remoteStrategy) {
        activeStrategies.push(new HybridStrategy(localStrategy, remoteStrategy));
      } else if (localStrategy) {
        activeStrategies.push(localStrategy);
      } else if (remoteStrategy) {
        activeStrategies.push(remoteStrategy);
      }

      Logger.instance = new Logger(activeStrategies);
    }
    return Logger.instance;
  }

  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    for (const strategy of this.strategies) {
      await strategy.log(level, message, context);
    }
  }

  debug(msg: string, ctx?: Record<string, unknown>) { return this.log("debug", msg, ctx); }
  info(msg: string, ctx?: Record<string, unknown>) { return this.log("info", msg, ctx); }
  warn(msg: string, ctx?: Record<string, unknown>) { return this.log("warn", msg, ctx); }
  error(msg: string, ctx?: Record<string, unknown>) { return this.log("error", msg, ctx); }
}

export const logger = Logger.getInstance();
