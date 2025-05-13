import fs from "fs";
import os from "os";
import path from "path";
import { Logger, LoggerBase, maskSecret } from "./logger";
import { LogLevel } from "./types";

export type FileLoggerConfig = {
  prefix?: string;
  logLevel?: LogLevel;
  logPath: string;
};

export class FileLogger extends LoggerBase implements Logger {
  private logPath: string;

  constructor(config: FileLoggerConfig) {
    super({
      prefix: config.prefix || "",
      logLevel: config.logLevel || LogLevel.INFO,
    });
    this.logPath = config.logPath;
    this.ensureLogDirectory();
  }

  protected now(): string {
    return new Date().toISOString();
  }

  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private appendToFile(message: string): void {
    const maskedMessage = maskSecret(message);
    fs.appendFileSync(this.logPath, `${maskedMessage}\n`);
  }

  verbose(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.VERBOSE, this.logLevel)) {
      this.appendToFile(
        `[VERBOSE] [${this.now()}] ${this.appendPrefix(
          this.prefix,
          ""
        )} ${message} ${args.length ? JSON.stringify(args) : ""}`
      );
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.INFO, this.logLevel)) {
      this.appendToFile(
        `[INFO] [${this.now()}] ${this.appendPrefix(
          this.prefix,
          ""
        )} ${message} ${args.length ? JSON.stringify(args) : ""}`
      );
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.ERROR, this.logLevel)) {
      this.appendToFile(
        `[ERROR] [${this.now()}] ${this.appendPrefix(
          this.prefix,
          ""
        )} ${message} ${args.length ? JSON.stringify(args) : ""}`
      );
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.WARN, this.logLevel)) {
      this.appendToFile(
        `[WARN] [${this.now()}] ${this.appendPrefix(
          this.prefix,
          ""
        )} ${message} ${args.length ? JSON.stringify(args) : ""}`
      );
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.isLogLevelEnabled(LogLevel.DEBUG, this.logLevel)) {
      this.appendToFile(
        `[DEBUG] [${this.now()}] ${this.appendPrefix(
          this.prefix,
          ""
        )} ${message} ${args.length ? JSON.stringify(args) : ""}`
      );
    }
  }

  withContext(context: string): Logger {
    return new FileLogger({
      prefix: this.appendPrefix(this.prefix, context),
      logLevel: this.logLevel,
      logPath: this.logPath,
    });
  }
}

export const newFileLogger = (config?: {
  filePath?: string;
  prefix?: string;
  logLevel?: LogLevel;
}): Logger => {
  return new FileLogger({
    logPath:
      config?.filePath ?? path.join(os.homedir(), ".mcpctl", "daemon.log"),
    prefix: config?.prefix,
    logLevel: config?.logLevel,
  });
};
