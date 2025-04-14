export interface Logger {
  verbose(message: string): void;
  log(message: string): void;
  error(message: string, error?: any): void;
  warn(message: string): void;
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  withContext(context: string): Logger;
}

// Basic logger implementation
class ConsoleLoggerImpl implements Logger {
  private readonly prefix: string;
  private readonly showVerbose: boolean;

  constructor(config?: {prefix?: string, showVerbose?: boolean}) {
    this.prefix = config?.prefix ?? "";
    this.showVerbose = config?.showVerbose ?? false;
  }

  verbose(message: string): void {
    if (this.showVerbose) {
      console.log(`[VERBOSE]: ${this.prefix} ${message}`);
    }
  }

  log(message: string): void {
    console.log(`[LOG]: ${this.prefix} ${message}`);
  }

  error(message: string, error?: any): void {
    if (error) {
      console.error(`[ERROR]: ${this.prefix} ${message}`, error);
    } else {
      console.error(`[ERROR]: ${this.prefix} ${message}`);
    }
  }

  warn(message: string): void {
    console.warn(`[WARN]: ${this.prefix} ${message}`);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.showVerbose) {
      if (context) {
        console.debug(`[DEBUG]: ${this.prefix} ${message}`, context);
      } else {
        console.debug(`[DEBUG]: ${this.prefix} ${message}`);
      }
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (context) {
      console.info(`[INFO]: ${this.prefix} ${message}`, context);
    } else {
      console.info(`[INFO]: ${this.prefix} ${message}`);
    }
  }

  withContext(context: string): Logger {
    return new ConsoleLoggerImpl({
      prefix: this.prefix ? `${this.prefix}:${context}` : context,
      showVerbose: this.showVerbose
    });
  }
}

let logger: Logger;

const newConsoleLogger = (config?: {prefix?: string, showVerbose?: boolean}): Logger => {
  if (!logger) {
    logger = new ConsoleLoggerImpl(config);
  }
  return logger;
};

export { logger, newConsoleLogger };

