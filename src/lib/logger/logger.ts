import { GLOBAL_CONSTANTS } from '../constants';
import { GLOBAL_ENV } from '../env';

export interface Logger {
  verbose(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  withContext(context: string): Logger;
}

export enum LogLevel {
  VERBOSE = 'VERBOSE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const logLevelOrder = [LogLevel.VERBOSE, LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];

export const verboseToLogLevel = (number: number | undefined, defaultLevel: LogLevel = LogLevel.INFO): LogLevel => {
  if (!number) {
    return defaultLevel;
  }
  if (number === 0) {
    return LogLevel.INFO;
  }
  if (number === 1) {
    return LogLevel.DEBUG;
  }
  if (number >= 2) {
    return LogLevel.VERBOSE;
  }
  return defaultLevel;
};

export type LoggerConfig = {
  prefix?: string;
  logLevel?: LogLevel;
};

export const maskSecret = (message: string): string => {
  if (
    GLOBAL_ENV.MASK_SECRET &&
    message.includes(GLOBAL_CONSTANTS.SECRET_TAG_START) &&
    message.includes(GLOBAL_CONSTANTS.SECRET_TAG_END)
  ) {
    return message.replace(
      new RegExp(`${GLOBAL_CONSTANTS.SECRET_TAG_START}.*?${GLOBAL_CONSTANTS.SECRET_TAG_END}`, 'g'),
      GLOBAL_CONSTANTS.SECRET_MASK
    );
  } else {
    return message.replace(
      new RegExp(`${GLOBAL_CONSTANTS.SECRET_TAG_START}|${GLOBAL_CONSTANTS.SECRET_TAG_END}`, 'g'),
      ''
    );
  }
};

export abstract class LoggerBase implements Logger {
  protected readonly prefix: string;
  protected readonly logLevel: LogLevel;

  constructor(config?: LoggerConfig) {
    this.prefix = config?.prefix ?? '';
    this.logLevel = config?.logLevel ?? LogLevel.INFO;
  }

  abstract verbose(message: string, context?: Record<string, any>): void;
  abstract info(message: string, context?: Record<string, any>): void;
  abstract error(message: string, context?: Record<string, any>): void;
  abstract warn(message: string, context?: Record<string, any>): void;
  abstract debug(message: string, context?: Record<string, any>): void;
  abstract withContext(context: string): Logger;

  protected appendPrefix(originalPrefix: string, newPrefix: string): string {
    return `${originalPrefix}:${newPrefix}`;
  }

  protected isLogLevelEnabled = (logLevel: LogLevel, currentLogLevel: LogLevel): boolean => {
    const index = logLevelOrder.indexOf(logLevel);
    const currentIndex = logLevelOrder.indexOf(currentLogLevel);
    return index >= currentIndex;
  };
}
