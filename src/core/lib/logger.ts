
interface Logger {
  log(message: string): void;
  error(message: string): void;
  warn(message: string): void;
}

// Basic logger implementation
class ConsoleLoggerImpl implements Logger {
  log(message: string): void {
    console.log(`[LOG]: ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR]: ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN]: ${message}`);
  }
}

const newConsoleLogger = (): Logger => {
  return new ConsoleLoggerImpl();
};

export {
  Logger,
  newConsoleLogger
};
