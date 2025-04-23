import fs from "fs";
import os from "os";
import path from "path";
import { Logger, LoggerBase, LogLevel, maskSecret } from "./logger";

export class FileLogger extends LoggerBase implements Logger {
  private readonly filePath: string;

  constructor(config?: {
    filePath?: string;
    prefix?: string;
    logLevel?: LogLevel;
  }) {
    super({
      prefix: config?.prefix,
      logLevel: config?.logLevel,
    });
    this.filePath =
      config?.filePath ?? path.join(os.homedir(), ".mcpctl", "daemon.log");
  }

  private now(): string {
    return new Date().toISOString();
  }
  verbose(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.VERBOSE, this.logLevel)) {
      const msg = `[VERBOSE] ${this.now()} ${this.prefix} ${message} ${
        context ? JSON.stringify(context) : ""
      }`;
      this.writeToFile(msg);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.INFO, this.logLevel)) {
      const msg = `[INFO] ${this.now()} ${this.prefix} ${message} ${
        context ? JSON.stringify(context) : ""
      }`;
      this.writeToFile(msg);
    }
  }

  error(message: string, error?: any): void {
    if (this.isLogLevelEnabled(LogLevel.ERROR, this.logLevel)) {
      const msg = `[ERROR] ${this.now()} ${this.prefix} ${message} ${
        error ? JSON.stringify(error) : ""
      }`;
      this.writeToFile(msg);
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.WARN, this.logLevel)) {
      const msg = `[WARN] ${this.now()} ${this.prefix} ${message} ${
        context ? JSON.stringify(context) : ""
      }`;
      this.writeToFile(msg);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isLogLevelEnabled(LogLevel.DEBUG, this.logLevel)) {
      const msg = `[DEBUG] ${this.now()} ${this.prefix} ${message} ${
        context ? JSON.stringify(context) : ""
      }`;
      this.writeToFile(msg);
    }
  }

  withContext(context: string): Logger {
    return new FileLogger({
      filePath: this.filePath,
      prefix: this.appendPrefix(this.prefix, context),
      logLevel: this.logLevel,
    });
  }

  private writeToFile(message: string): void {
    const maskedMessage = maskSecret(message);
    fs.appendFileSync(this.filePath, `${maskedMessage}\n`);
  }
}

export const newFileLogger = (config?: {
  filePath?: string;
  prefix?: string;
  logLevel?: LogLevel;
}): Logger => {
  return new FileLogger(config);
};
