import fs from "fs";
import os from "os";
import path from "path";
import { Logger } from "./logger";

export class FileLogger implements Logger {
  private readonly filePath: string;
  private readonly prefix: string;
  private readonly showVerbose: boolean;

  constructor(config?: {
    filePath?: string;
    prefix?: string;
    showVerbose?: boolean;
  }) {
    this.filePath =
      config?.filePath ?? path.join(os.homedir(), ".mcpctl", "daemon.log");
    this.prefix = config?.prefix ?? "";
    this.showVerbose = config?.showVerbose ?? false;
  }

  private now(): string {
    return new Date().toISOString();
  }
  verbose(message: string): void {
    const msg = `[VERBOSE] ${this.now()} ${this.prefix} ${message}`;
    this.writeToFile(msg);
  }

  log(message: string): void {
    const msg = `[LOG] ${this.now()} ${this.prefix} ${message}`;
    this.writeToFile(msg);
  }

  error(message: string, error?: any): void {
    const msg = `[ERROR] ${this.now()} ${this.prefix} ${message} ${
      error ? JSON.stringify(error) : ""
    }`;
    this.writeToFile(msg);
  }

  warn(message: string): void {
    const msg = `[WARN] ${this.now()} ${this.prefix} ${message}`;
    this.writeToFile(msg);
  }

  debug(message: string, context?: Record<string, any>): void {
    const msg = `[DEBUG] ${this.now()} ${this.prefix} ${message} ${
      context ? JSON.stringify(context) : ""
    }`;
    this.writeToFile(msg);
  }

  info(message: string, context?: Record<string, any>): void {
    const msg = `[INFO] ${this.now()} ${this.prefix} ${message} ${
      context ? JSON.stringify(context) : ""
    }`;
    this.writeToFile(msg);
  }

  withContext(context: string): Logger {
    return new FileLogger({
      filePath: this.filePath,
      prefix: this.prefix + " | " + context,
      showVerbose: this.showVerbose,
    });
  }

  private writeToFile(message: string): void {
    fs.appendFileSync(this.filePath, `${message}\n`);
  }
}

export const newFileLogger = (config?: {
  filePath?: string;
  prefix?: string;
  showVerbose?: boolean;
}): Logger => {
  return new FileLogger(config);
};
