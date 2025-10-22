import { ILogger, LogLevel } from "./ILogger";
import { LocalFileStrategy } from "./strategies/LocalFileStrategy";
import { RemoteSigNozStrategy } from "./strategies/RemoteSigNozStrategy";
import { HybridStrategy } from "./strategies/HybridStrategy";
import { ConsoleStrategy } from "./strategies/ConsoleStrategy";
import { loggingConfig } from "./LoggingConfig";

const logLevelOrder: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private static instance: Logger;
  private strategies: ILogger[];
  private minimumLogLevel: LogLevel;

  private constructor(strategies: ILogger[], minimumLogLevel: LogLevel) {
    this.strategies = strategies;
    this.minimumLogLevel = minimumLogLevel;
  }

  static getInstance(
    localStrategyFactory: () => LocalFileStrategy = () => new LocalFileStrategy(),
    remoteStrategyFactory: (otlpEndpoint: string) => RemoteSigNozStrategy = (otlpEndpoint) => new RemoteSigNozStrategy(otlpEndpoint)
  ): Logger {
    if (!Logger.instance) {
      const activeStrategies: ILogger[] = [];

      if (loggingConfig.mode === "off") {
        Logger.instance = new Logger(activeStrategies, "error"); // Set minimumLogLevel to error, but activeStrategies is empty
        return Logger.instance;
      }

      const minimumLogLevel = logLevelOrder[loggingConfig.mode] !== undefined ? loggingConfig.mode : "info";

      if (loggingConfig.consoleEnabled) {
        activeStrategies.push(new ConsoleStrategy());
      }

      let localStrategy: LocalFileStrategy | undefined;
      if (loggingConfig.localEnabled) {
        localStrategy = localStrategyFactory();
      }

      let remoteStrategy: RemoteSigNozStrategy | undefined;
      if (loggingConfig.remoteEnabled) {
        remoteStrategy = remoteStrategyFactory(loggingConfig.signozOtlpEndpoint);
      }

      if (localStrategy && remoteStrategy) {
        activeStrategies.push(new HybridStrategy(localStrategy, remoteStrategy));
      } else if (localStrategy) {
        activeStrategies.push(localStrategy);
      } else if (remoteStrategy) {
        activeStrategies.push(remoteStrategy);
      }

      Logger.instance = new Logger(activeStrategies, minimumLogLevel);
    }
    return Logger.instance;
  }

  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    // Always log errors, regardless of the minimumLogLevel
    if (level !== "error" && logLevelOrder[level] < logLevelOrder[this.minimumLogLevel]) {
      return; // Do not log if the level is below the minimum and it"s not an error
    }

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
