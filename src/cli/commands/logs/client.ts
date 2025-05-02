import arg from "arg";
import { spawn } from "child_process";
import fs from "fs";
import { unlink } from "fs/promises";
import inquirer from "inquirer";
import os from "os";
import path from "path";
import { promisify } from "util";
import { CliError } from "../../../lib/errors";
import { App } from "../../app";

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);
const exists = promisify(fs.exists);

// OS별 로그 경로 설정
interface LogPathConfig {
  claude: {
    base: string;
    mainLog: string;
    serverLog: (server: string) => string;
  };
  cursor: {
    base: string;
    logPath: (date: string, window: string) => string;
  };
}

const logPaths: Record<string, LogPathConfig> = {
  darwin: {
    claude: {
      base: path.join(os.homedir(), "Library", "Logs", "Claude"),
      mainLog: "mcp.log",
      serverLog: (server: string) => `mcp-server-${server}.log`,
    },
    cursor: {
      base: path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Cursor",
        "logs"
      ),
      logPath: (date: string, window: string) =>
        path.join(
          date,
          window,
          "exthost",
          "anysphere.cursor-always-local",
          "Cursor MCP.log"
        ),
    },
  },
  linux: {
    claude: {
      base: path.join(os.homedir(), ".config", "claude", "logs"),
      mainLog: "mcp.log",
      serverLog: (server: string) => `mcp-server-${server}.log`,
    },
    cursor: {
      base: path.join(os.homedir(), ".config", "Cursor", "logs"),
      logPath: (date: string, window: string) =>
        path.join(
          date,
          window,
          "exthost",
          "anysphere.cursor-always-local",
          "Cursor MCP.log"
        ),
    },
  },
  win32: {
    claude: {
      base: path.join(os.homedir(), "AppData", "Local", "Claude", "logs"),
      mainLog: "mcp.log",
      serverLog: (server: string) => `mcp-server-${server}.log`,
    },
    cursor: {
      base: path.join(os.homedir(), "AppData", "Roaming", "Cursor", "logs"),
      logPath: (date: string, window: string) =>
        path.join(
          date,
          window,
          "exthost",
          "anysphere.cursor-always-local",
          "Cursor MCP.log"
        ),
    },
  },
};

// 현재 OS의 로그 경로 설정 가져오기
function getLogPaths(): LogPathConfig {
  const platform = os.platform();
  const config = logPaths[platform];
  if (!config) {
    throw new CliError(`Unsupported platform: ${platform}`);
  }
  return config;
}

const clientLogsCommandOptions = {
  "--viewer": String,
  "--server": String,
  "--date": String,
  "--window": String,
  "--all": Boolean,
  "-v": "--viewer",
  "-s": "--server",
  "-d": "--date",
  "-w": "--window",
  "-a": "--all",
};

export const clientLogsCommand = async (app: App, argv: string[]) => {
  const options = arg(clientLogsCommandOptions, {
    argv,
  });
  const subArgv = options["_"];
  const logger = app.getLogger();

  if (!subArgv || subArgv.length === 0) {
    console.log("Client logs command");
    console.log("Available subcommands:");
    console.log("  list\tList available client logs");
    console.log("  view\tView client logs");
    console.log("  follow\tFollow client logs in real-time");
    console.log("  remove\tRemove client logs");
    return;
  }

  const subCommand = subArgv[0];
  const clientName = subArgv[1];
  const viewer = options["--viewer"] || "less";
  const server = options["--server"];
  const date = options["--date"];
  const window = options["--window"];
  const all = options["--all"] || false;

  if (!clientName && subCommand !== "list") {
    logger.error("Error: Client name is required.");
    throw new CliError("Error: Client name is required.");
  }

  try {
    const logPaths = getLogPaths();
    switch (subCommand) {
      case "list":
        await listClientLogs(clientName, logPaths);
        break;
      case "view":
        await viewClientLogs(
          clientName,
          viewer,
          server,
          date,
          window,
          all,
          logPaths
        );
        break;
      case "follow":
        await followClientLogs(clientName, server, date, window, logPaths);
        break;
      case "remove":
        await removeClientLogs(clientName, server, date, window, logPaths);
        break;
      default:
        logger.error(`Error: '${subCommand}' is an unknown subcommand.`);
        console.log("Available subcommands:");
        console.log("  list\tList available client logs");
        console.log("  view\tView client logs");
        console.log("  follow\tFollow client logs in real-time");
        console.log("  remove\tRemove client logs");
        throw new CliError(`Error: '${subCommand}' is an unknown subcommand.`);
    }
  } catch (error: unknown) {
    if (error instanceof CliError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error: ${errorMessage}`);
    throw new CliError(`Error: ${errorMessage}`);
  }
};

async function listClientLogs(clientName: string, logPaths: LogPathConfig) {
  if (clientName === "claude") {
    const { base, mainLog, serverLog } = logPaths.claude;
    if (!(await exists(base))) {
      console.log("No Claude logs found.");
      return;
    }

    const files = await readdir(base);
    const logFiles = await Promise.all(
      files
        .filter((file) => file.startsWith("mcp"))
        .map(async (file) => {
          const stats = await stat(path.join(base, file));
          return {
            name: file,
            size: formatFileSize(stats.size),
            modified: stats.mtime,
          };
        })
    );

    console.log("Available Claude logs:");
    logFiles.forEach((file) => {
      console.log(
        `- ${file.name} (${
          file.size
        }, modified ${file.modified.toLocaleString()})`
      );
    });
  } else if (clientName === "cursor") {
    const { base, logPath } = logPaths.cursor;
    if (!(await exists(base))) {
      console.log("No Cursor logs found.");
      return;
    }

    const dates = await readdir(base);
    console.log("Available Cursor logs by date:");
    for (const date of dates) {
      const dateDir = path.join(base, date);
      const windows = await readdir(dateDir);
      for (const window of windows) {
        const logPath = path.join(base, logPaths.cursor.logPath(date, window));
        if (await exists(logPath)) {
          const stats = await stat(logPath);
          console.log(
            `- ${date}/${window} (${formatFileSize(
              stats.size
            )}, modified ${stats.mtime.toLocaleString()})`
          );
        }
      }
    }
  } else {
    console.log("Unknown client. Available clients: claude, cursor");
  }
}

async function viewClientLogs(
  clientName: string,
  viewer: string,
  server: string | undefined,
  date: string | undefined,
  window: string | undefined,
  all: boolean,
  logPaths: LogPathConfig
) {
  if (clientName === "claude") {
    const { base, mainLog, serverLog } = logPaths.claude;
    if (!(await exists(base))) {
      console.log("No Claude logs found.");
      return;
    }

    let logFile: string;
    if (server) {
      logFile = path.join(base, serverLog(server));
    } else {
      logFile = path.join(base, mainLog);
    }

    if (!(await exists(logFile))) {
      console.log(
        `No log found for ${server ? `server ${server}` : "Claude"}.`
      );
      return;
    }

    const { command, args } = getViewerCommand(viewer, logFile);
    spawn(command, args, { stdio: "inherit" });
  } else if (clientName === "cursor") {
    const { base, logPath } = logPaths.cursor;
    if (!(await exists(base))) {
      console.log("No Cursor logs found.");
      return;
    }

    if (all) {
      // Combine all logs into a temporary file
      const tempFile = path.join(os.tmpdir(), "cursor-mcp-all.log");
      let content = "";

      let dates = date ? [date] : await readdir(base);
      // if mac, ignore .DS_Store
      if (os.platform() === "darwin") {
        dates = dates.filter((d) => d !== ".DS_Store");
      }
      for (const d of dates) {
        const dateDir = path.join(base, d);
        if (!(await exists(dateDir))) continue;

        const windows = window ? [window] : await readdir(dateDir);
        for (const w of windows) {
          const logPath = path.join(base, logPaths.cursor.logPath(d, w));
          if (await exists(logPath)) {
            const logContent = await readFile(logPath, "utf8");
            content += `\n=== ${d}/${w} ===\n${logContent}`;
          }
        }
      }

      await writeFile(tempFile, content);
      const { command, args } = getViewerCommand(viewer, tempFile);
      spawn(command, args, { stdio: "inherit" });
    } else {
      if (!date || !window) {
        console.log(
          "Error: Date and window are required for viewing specific Cursor logs."
        );
        return;
      }

      const logPath = path.join(base, logPaths.cursor.logPath(date, window));

      if (!(await exists(logPath))) {
        console.log(`No log found for date ${date} and window ${window}.`);
        return;
      }

      const { command, args } = getViewerCommand(viewer, logPath);
      spawn(command, args, { stdio: "inherit" });
    }
  } else {
    console.log("Unknown client. Available clients: claude, cursor");
  }
}

async function followClientLogs(
  clientName: string,
  server: string | undefined,
  date: string | undefined,
  window: string | undefined,
  logPaths: LogPathConfig
) {
  if (clientName === "claude") {
    const { base, mainLog, serverLog } = logPaths.claude;
    if (!(await exists(base))) {
      console.log("No Claude logs found.");
      return;
    }

    let logFile: string;
    if (server) {
      logFile = path.join(base, serverLog(server));
    } else {
      logFile = path.join(base, mainLog);
    }

    if (!(await exists(logFile))) {
      console.log(
        `No log found for ${server ? `server ${server}` : "Claude"}.`
      );
      return;
    }

    const { command, args } = getViewerCommand("tail", logFile);
    spawn(command, args, { stdio: "inherit" });
  } else if (clientName === "cursor") {
    const { base, logPath } = logPaths.cursor;

    if (!date || !window) {
      // Find the most recent log
      if (!(await exists(base))) {
        console.log("No Cursor logs found.");
        return;
      }

      let dates = await readdir(base);
      // if mac, ignore .DS_Store
      if (os.platform() === "darwin") {
        dates = dates.filter((d) => d !== ".DS_Store");
      }

      let mostRecentDate = "";
      let mostRecentWindow = "";
      let mostRecentTime = 0;

      for (const d of dates) {
        const dateDir = path.join(base, d);
        if (!(await exists(dateDir))) continue;

        const windows = await readdir(dateDir);
        for (const w of windows) {
          const logPath = path.join(base, logPaths.cursor.logPath(d, w));
          if (await exists(logPath)) {
            const stats = await stat(logPath);
            if (stats.mtime.getTime() > mostRecentTime) {
              mostRecentTime = stats.mtime.getTime();
              mostRecentDate = d;
              mostRecentWindow = w;
            }
          }
        }
      }

      if (!mostRecentDate || !mostRecentWindow) {
        console.log("No Cursor logs found.");
        return;
      }

      date = mostRecentDate;
      window = mostRecentWindow;
      console.log(`Following most recent log: ${date}/${window}`);
    }

    const fullLogPath = path.join(base, logPath(date, window));

    if (!(await exists(fullLogPath))) {
      console.log(`No log found for date ${date} and window ${window}.`);
      return;
    }

    const { command, args } = getViewerCommand("tail", fullLogPath);
    spawn(command, args, { stdio: "inherit" });
  } else {
    console.log("Unknown client. Available clients: claude, cursor");
  }
}

async function removeClientLogs(
  clientName: string,
  server: string | undefined,
  date: string | undefined,
  window: string | undefined,
  logPaths: LogPathConfig
) {
  if (clientName === "claude") {
    const { base, mainLog, serverLog } = logPaths.claude;
    if (!(await exists(base))) {
      console.log("No Claude logs found.");
      return;
    }

    let targetFiles: string[] = [];
    if (server) {
      const logFile = path.join(base, serverLog(server));
      if (await exists(logFile)) {
        targetFiles.push(logFile);
      }
    } else {
      const mainLogFile = path.join(base, mainLog);
      if (await exists(mainLogFile)) {
        targetFiles.push(mainLogFile);
      }
    }

    if (targetFiles.length === 0) {
      console.log(
        `No Claude logs found for ${server ? `server ${server}` : "main log"}.`
      );
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to remove ${targetFiles.length} Claude log file(s)?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log("Operation cancelled.");
      return;
    }

    for (const file of targetFiles) {
      await unlink(file);
      console.log(`Removed: ${path.basename(file)}`);
    }
    console.log("All selected Claude logs have been removed.");
  } else if (clientName === "cursor") {
    const { base, logPath } = logPaths.cursor;
    if (!(await exists(base))) {
      console.log("No Cursor logs found.");
      return;
    }

    let targetFiles: string[] = [];
    if (date && window) {
      const logFile = path.join(base, logPaths.cursor.logPath(date, window));
      if (await exists(logFile)) {
        targetFiles.push(logFile);
      }
    } else {
      const dates = await readdir(base);
      for (const d of dates) {
        const dateDir = path.join(base, d);
        if (!(await exists(dateDir))) continue;

        const windows = await readdir(dateDir);
        for (const w of windows) {
          const logFile = path.join(base, logPaths.cursor.logPath(d, w));
          if (await exists(logFile)) {
            targetFiles.push(logFile);
          }
        }
      }
    }

    if (targetFiles.length === 0) {
      console.log(
        `No Cursor logs found for ${
          date && window
            ? `date ${date} and window ${window}`
            : "any date and window"
        }.`
      );
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to remove ${targetFiles.length} Cursor log file(s)?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log("Operation cancelled.");
      return;
    }

    for (const file of targetFiles) {
      await unlink(file);
      console.log(`Removed: ${path.basename(file)}`);
    }
    console.log("All selected Cursor logs have been removed.");
  } else {
    console.log("Unknown client. Available clients: claude, cursor");
  }
}

function getViewerCommand(
  viewer: string,
  file: string
): { command: string; args: string[] } {
  switch (viewer.toLowerCase()) {
    case "less":
      return { command: "less", args: [file] };
    case "tail":
      return { command: "tail", args: ["-f", file] };
    case "bat":
      return { command: "bat", args: ["--paging=always", file] };
    case "fzf":
      return { command: "sh", args: ["-c", `cat ${file} | fzf`] };
    default:
      return { command: "less", args: [file] };
  }
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)}${units[unitIndex]}`;
}
