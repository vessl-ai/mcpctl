import fs from 'fs';
import os from "os";
import path from "path";
import { Logger } from "./logger";

export class FileLogger implements Logger {
  private readonly filePath: string;
  private readonly prefix: string;
  private readonly showVerbose: boolean;

  constructor(config?: { filePath?: string; prefix?: string; showVerbose?: boolean }) {
    this.filePath = config?.filePath ?? path.join(os.homedir(), ".mcpctl", "daemon.log");
    this.prefix = config?.prefix ?? "";
    this.showVerbose = config?.showVerbose ?? false;
  }

  verbose(message: string): void {
    const msg = `[VERBOSE] ${new Date().toISOString()} ${this.prefix} ${message}`;
    this.writeToFile(msg);
  }

  log(message: string): void {
    const msg = `[LOG] ${new Date().toISOString()} ${this.prefix} ${message}`;
    this.writeToFile(msg);
  }

  error(message: string, error?: any): void {
    const msg = `[ERROR] ${new Date().toISOString()} ${this.prefix} ${message}`;
    this.writeToFile(msg);
  }

  warn(message: string): void {
    const msg = `[WARN] ${new Date().toISOString()} ${this.prefix} ${message}`;
    this.writeToFile(msg);
  }

  debug(message: string, context?: Record<string, any>): void {
    const msg = `[DEBUG] ${new Date().toISOString()} ${this.prefix} ${message}`;
    this.writeToFile(msg);
  }

  info(message: string, context?: Record<string, any>): void {
    const msg = `[INFO] ${new Date().toISOString()} ${this.prefix} ${message}`;
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

export const newFileLogger = (config?: { filePath?: string; prefix?: string; showVerbose?: boolean }): Logger => {
  return new FileLogger(config);
};
