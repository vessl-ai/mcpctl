
interface Logger {
  verbose(message: string): void;
  log(message: string): void;
  error(message: string): void;
  warn(message: string): void;
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

  error(message: string): void {
    console.error(`[ERROR]: ${this.prefix} ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN]: ${this.prefix} ${message}`);
  }
}

let logger: Logger;

const newConsoleLogger = (config?: {prefix?: string, showVerbose?: boolean}): Logger => {
  if (!logger) {
    logger = new ConsoleLoggerImpl(config);
  }
  return logger;
};

export {
  Logger, logger, newConsoleLogger
};

