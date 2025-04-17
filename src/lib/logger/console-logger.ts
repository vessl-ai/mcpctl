import { Logger, LoggerBase, LoggerConfig, LogLevel } from "./logger";

export type ConsoleLoggerConfig = LoggerConfig & {
  useStderr?: boolean;
};

class ConsoleLoggerImpl extends LoggerBase implements Logger {
  private useStderr: boolean;

  constructor(config?: ConsoleLoggerConfig) {
    super(config);
    // default to stderr because mcp server uses stdio for transport
    this.useStderr = config?.useStderr ?? true;
  }

  private pushLog(message: string): void {
    if (this.useStderr) {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  now(): string {
    return new Date().toISOString();
  }

  verbose(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.VERBOSE, this.logLevel)) {
      this.pushLog(
        `[VERBOSE]: [${this.now()}] [${
          this.prefix
        }] ${message} ${JSON.stringify(context)}`
      );
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.INFO, this.logLevel)) {
      this.pushLog(
        `[INFO]: [${this.now()}] [${this.prefix}] ${message} ${
          context ? JSON.stringify(context) : ""
        }`
      );
    }
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.ERROR, this.logLevel)) {
      this.pushLog(
        `[ERROR]: [${this.now()}] [${this.prefix}] ${message} ${
          context ? JSON.stringify(context) : ""
        }`
      );
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.WARN, this.logLevel)) {
      this.pushLog(
        `[WARN]: [${this.now()}] [${this.prefix}] ${message} ${
          context ? JSON.stringify(context) : ""
        }`
      );
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.DEBUG, this.logLevel)) {
      if (context) {
        this.pushLog(
          `[DEBUG]: [${this.now()}] [${this.prefix}] ${message} ${
            context ? JSON.stringify(context) : ""
          }`
        );
      } else {
        this.pushLog(`[DEBUG]: [${this.now()}] [${this.prefix}] ${message}`);
      }
    }
  }

  withContext(context: string): Logger {
    return new ConsoleLoggerImpl({
      prefix: this.appendPrefix(this.prefix, context),
      logLevel: this.logLevel,
    });
  }
}

let logger: Logger;

const newConsoleLogger = (config?: ConsoleLoggerConfig): Logger => {
  if (!logger) {
    logger = new ConsoleLoggerImpl(config);
  }
  return logger;
};

export { logger, newConsoleLogger };
