import { ILogger, LogLevel, ParsedLogEntry } from "./ILogger";
import { LocalFileStrategy } from "./strategies/LocalFileStrategy";
import { SigNozProvider } from "./providers/SigNozProvider";
import { HybridStrategy } from "./strategies/HybridStrategy";
import { ConsoleStrategy } from "./strategies/ConsoleStrategy";
import { loggingConfig } from "./LoggingConfig";
import { ICloudLogger } from "./ICloudLogger";
import { Salter } from "signify-ts";

const logLevelOrder: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private static instance: Logger;
  private strategies: ILogger[];
  private minimumLogLevel: LogLevel;

  private constructor(strategies: ILogger[], minimumLogLevel: LogLevel) {
    this.strategies = strategies;
    this.minimumLogLevel = minimumLogLevel;
  }

  static getInstance(
    localStrategyFactory: () => LocalFileStrategy = () => new LocalFileStrategy(),
    cloudLoggerFactory: (otlpEndpoint: string) => ICloudLogger = (otlpEndpoint) => new SigNozProvider(otlpEndpoint)
  ): Logger {
    if (!Logger.instance) {
      const activeStrategies: ILogger[] = [];

      if (loggingConfig.mode === "off") {
        Logger.instance = new Logger(activeStrategies, "error");
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

      let cloudLogger: ICloudLogger | undefined;
      if (loggingConfig.remoteEnabled) {
        cloudLogger = cloudLoggerFactory(loggingConfig.signozOtlpEndpoint);
      }

      if (localStrategy && cloudLogger) {
        activeStrategies.push(new HybridStrategy(localStrategy, cloudLogger));
      } else if (localStrategy) {
        activeStrategies.push(localStrategy);
      } else if (cloudLogger) {
        activeStrategies.push(cloudLogger);
      }

          Logger.instance = new Logger(activeStrategies, minimumLogLevel);
        }
        return Logger.instance;
  }

  async log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (level !== "error" && logLevelOrder[level] < logLevelOrder[this.minimumLogLevel]) {
      return;
    }

    const logEntry: ParsedLogEntry = {
      id: new Salter({}).qb64,
      ts: new Date().toISOString(),
      level,
      message,
      context,
    };

    for (const strategy of this.strategies) {
      await strategy.log(logEntry);
    }
  }

  debug(msg: string, ctx?: Record<string, unknown>) { return this.log("debug", msg, ctx); }
  info(msg: string, ctx?: Record<string, unknown>) { return this.log("info", msg, ctx); }
  warn(msg: string, ctx?: Record<string, unknown>) { return this.log("warn", msg, ctx); }
  error(msg: string, ctx?: Record<string, unknown>) { return this.log("error", msg, ctx); }
}

export const logger = Logger.getInstance();
