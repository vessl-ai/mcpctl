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

  private pushLog(message: string, context?: Record<string, any>): void {
    if (this.useStderr) {
      console.error(`[ERROR]: [${this.now()}] [${this.prefix}] ${message}`);
    } else {
      console.log(`[INFO]: [${this.now()}] [${this.prefix}] ${message}`);
    }
  }

  now(): string {
    return new Date().toISOString();
  }

  verbose(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.VERBOSE, this.logLevel)) {
      this.pushLog(message, context);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.INFO, this.logLevel)) {
      this.pushLog(message, context);
    }
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.ERROR, this.logLevel)) {
      this.pushLog(message, context);
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.WARN, this.logLevel)) {
      this.pushLog(message, context);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.DEBUG, this.logLevel)) {
      if (context) {
        this.pushLog(message, context);
      } else {
        this.pushLog(message);
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
