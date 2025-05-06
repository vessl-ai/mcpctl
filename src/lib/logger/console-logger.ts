import { Logger, LoggerBase, LogLevel } from "./logger";

export type ConsoleLoggerConfig = {
  prefix?: string;
  logLevel?: LogLevel;
};

export class ConsoleLogger extends LoggerBase implements Logger {
  constructor(config?: ConsoleLoggerConfig) {
    super({
      prefix: config?.prefix || "",
      logLevel: config?.logLevel || LogLevel.INFO,
    });
  }

  verbose(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.VERBOSE, this.logLevel)) {
      console.log(
        `[VERBOSE] ${this.appendPrefix(this.prefix, "")} ${message}`,
        ...args
      );
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.INFO, this.logLevel)) {
      console.info(
        `[INFO] ${this.appendPrefix(this.prefix, "")} ${message}`,
        ...args
      );
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.ERROR, this.logLevel)) {
      console.error(
        `[ERROR] ${this.appendPrefix(this.prefix, "")} ${message}`,
        ...args
      );
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.WARN, this.logLevel)) {
      console.warn(
        `[WARN] ${this.appendPrefix(this.prefix, "")} ${message}`,
        ...args
      );
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.DEBUG, this.logLevel)) {
      console.debug(
        `[DEBUG] ${this.appendPrefix(this.prefix, "")} ${message}`,
        ...args
      );
    }
  }

  withContext(context: string): Logger {
    return new ConsoleLogger({
      prefix: this.appendPrefix(this.prefix, context),
      logLevel: this.logLevel,
    });
  }
}

let logger: Logger;

const newConsoleLogger = (config?: ConsoleLoggerConfig): Logger => {
  if (!logger) {
    logger = new ConsoleLogger(config);
  }
  return logger;
};

export { logger, newConsoleLogger };
