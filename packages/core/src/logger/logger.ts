import winston from "winston";
import { Config } from "../config";
import { LogLevel } from "./types";

export abstract class LoggerBase {
  protected prefix: string;
  protected logLevel: LogLevel;

  constructor(options: { prefix: string; logLevel: LogLevel }) {
    this.prefix = options.prefix;
    this.logLevel = options.logLevel;
  }

  protected isLogLevelEnabled(
    level: LogLevel,
    currentLevel: LogLevel
  ): boolean {
    return level >= currentLevel;
  }

  protected appendPrefix(prefix: string, context: string): string {
    return context ? `${prefix}:${context}` : prefix;
  }

  protected now(): string {
    return new Date().toISOString();
  }

  abstract verbose(message: string, ...args: any[]): void;
  abstract info(message: string, ...args: any[]): void;
  abstract error(message: string, ...args: any[]): void;
  abstract warn(message: string, ...args: any[]): void;
  abstract debug(message: string, ...args: any[]): void;
  abstract withContext(context: string): Logger;
}

export interface Logger {
  verbose(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  withContext(context: string): Logger;
}
export const logLevel = (): LogLevel => {
  let logLevel = process.env.MCPCTL_LOG_LEVEL;
  if (!logLevel) {
    return LogLevel.INFO;
  }
  logLevel = logLevel.trim().toLowerCase();
  switch (logLevel) {
    case "verbose":
      return LogLevel.VERBOSE;
    case "debug":
      return LogLevel.DEBUG;
    case "info":
      return LogLevel.INFO;
    case "warn":
      return LogLevel.WARN;
    case "error":
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
};

const logLevelOrder = [
  LogLevel.VERBOSE,
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
];

export const verboseToLogLevel = (
  number: number | undefined,
  defaultLevel: LogLevel = LogLevel.INFO
): LogLevel => {
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
  transports?: winston.transport[];
  logPath?: string;
  console?: {
    stdout?: boolean;
    stderr?: boolean;
  };
};

export const maskSecret = (message: string): string => {
  if (
    Config.Secret.MASK_SECRET &&
    message.includes(Config.Secret.SECRET_TAG_START) &&
    message.includes(Config.Secret.SECRET_TAG_END)
  ) {
    return message.replace(
      new RegExp(
        `${Config.Secret.SECRET_TAG_START}.*?${Config.Secret.SECRET_TAG_END}`,
        "g"
      ),
      Config.Secret.SECRET_MASK
    );
  } else {
    return message.replace(
      new RegExp(
        `${Config.Secret.SECRET_TAG_START}|${Config.Secret.SECRET_TAG_END}`,
        "g"
      ),
      ""
    );
  }
};

export class WinstonLogger implements Logger {
  private readonly logger: winston.Logger;
  private readonly prefix: string;

  constructor(config?: LoggerConfig) {
    const defaultTransports: winston.transport[] = [];

    // Add console transports based on config
    const consoleConfig = config?.console ?? { stdout: true, stderr: false };

    const customFormat = winston.format.printf(
      ({ level, message, timestamp, ...meta }) => {
        const prefix = config?.prefix ? `[${config.prefix}]` : "";
        const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
        return `${timestamp} ${level} ${prefix} ${message} ${metaString}`;
      }
    );

    if (consoleConfig.stdout) {
      defaultTransports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            customFormat
          ),
        })
      );
    }
    if (consoleConfig.stderr) {
      defaultTransports.push(
        new winston.transports.Console({
          level: "info",
          stderrLevels: ["verbose", "debug", "info", "warn", "error"],
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            customFormat
          ),
        })
      );
    }

    this.prefix = config?.prefix ?? "";
    this.logger = winston.createLogger({
      level: config?.logLevel?.toLowerCase() ?? "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: defaultTransports,
    });

    if (config?.transports) {
      config.transports.forEach((transport) => {
        this.logger.add(transport);
      });
    }

    // Add file transport if logPath is provided
    if (config?.logPath) {
      this.logger.add(
        new winston.transports.File({
          filename: config.logPath,
          format: winston.format.combine(
            winston.format.timestamp(),
            customFormat
          ),
        })
      );
    }
  }

  verbose(message: string, context?: Record<string, any>): void {
    this.logger.verbose(message, { ...context, prefix: this.prefix });
  }

  info(message: string, context?: Record<string, any>): void {
    this.logger.info(message, { ...context, prefix: this.prefix });
  }

  error(message: string, context?: Record<string, any>): void {
    this.logger.error(message, { ...context, prefix: this.prefix });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(message, { ...context, prefix: this.prefix });
  }

  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(message, { ...context, prefix: this.prefix });
  }

  withContext(context: string): Logger {
    return new WinstonLogger({
      prefix: this.appendPrefix(this.prefix, context),
      logLevel: this.logger.level as LogLevel,
      transports: this.logger.transports,
    });
  }

  private appendPrefix(originalPrefix: string, newPrefix: string): string {
    return `${originalPrefix}:${newPrefix}`;
  }
}

export const newLogger = (config?: LoggerConfig): Logger => {
  return new WinstonLogger(config);
};
