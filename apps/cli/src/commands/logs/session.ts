import arg from "arg";
import { spawn } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import os from "os";
import path from "path";
import { CliError } from "../../../lib/errors";
import { App } from "../../app";

const sessionLogsCommandOptions = {
  "--viewer": String,
  "--since": String,
  "--until": String,
  "-v": "--viewer",
  "-s": "--since",
  "-u": "--until",
};

export const sessionLogsCommand = async (app: App, argv: string[]) => {
  const options = arg(sessionLogsCommandOptions, {
    argv,
    stopAtPositional: true,
  });
  const subArgv = options["_"];
  const logger = app.getLogger();

  if (!subArgv || subArgv.length === 0) {
    console.log("Session logs command");
    console.log("Available subcommands:");
    console.log("  list\tList available session logs");
    console.log("  view\tView session logs");
    console.log("  follow\tFollow session logs in real-time");
    return;
  }

  const subCommand = subArgv[0];
  const clientName = subArgv[1];
  const serverName = subArgv[2];
  const logDir = path.join(os.homedir(), "Library/Logs/mcpctl", "sessions");
  const viewer = options["--viewer"] || "less";

  if ((!clientName || !serverName) && subCommand !== "list") {
    logger.error("Error: Client name and server name are required.");
    throw new CliError("Error: Client name and server name are required.");
  }

  switch (subCommand) {
    case "list":
      await listSessionLogs(logDir);
      break;
    case "view":
      await viewSessionLogs(app, logDir, clientName, serverName, viewer);
      break;
    case "follow":
      await followSessionLogs(app, logDir, clientName, serverName);
      break;
    case "remove":
      await removeSessionLogs(logDir, clientName, serverName);
      break;
    default:
      logger.error(`Error: '${subCommand}' is an unknown subcommand.`);
      console.log("Available subcommands:");
      console.log("  list\tList available session logs");
      console.log("  view\tView session logs");
      console.log("  follow\tFollow session logs in real-time");
      console.log("  remove\tRemove session logs");
      throw new CliError(`Error: '${subCommand}' is an unknown subcommand.`);
  }
};

async function listSessionLogs(logDir: string) {
  if (!fs.existsSync(logDir)) {
    console.log("No session logs found.");
    return;
  }

  const files = fs
    .readdirSync(logDir)
    .filter((file) => file.startsWith("session.") && file.endsWith(".log"))
    .map((file) => {
      const stats = fs.statSync(path.join(logDir, file));
      const [_, client, server] = file.split(".");
      return {
        name: file,
        client,
        server,
        size: formatFileSize(stats.size),
        modified: stats.mtime,
      };
    });

  console.log("Available session logs:");
  files.forEach((file) => {
    console.log(
      `- ${file.name} (${
        file.size
      }, modified ${file.modified.toLocaleString()})`
    );
  });
}

async function viewSessionLogs(
  app: App,
  logDir: string,
  clientName: string,
  serverName: string,
  viewer: string
) {
  const logFile = path.join(logDir, `session.${clientName}.${serverName}.log`);
  if (!fs.existsSync(logFile)) {
    console.log(
      `No log found for client ${clientName} and server ${serverName}.`
    );
    return;
  }

  if (viewer.toLowerCase() === "fzf") {
    const cat = spawn("cat", [logFile]);
    const fzf = spawn("fzf", [], { stdio: ["pipe", "inherit", "inherit"] });
    cat.stdout.pipe(fzf.stdin);
  } else {
    const [command, args] = getViewerCommand(viewer, logFile);
    spawn(command, args, { stdio: "inherit" });
  }
}

async function followSessionLogs(
  app: App,
  logDir: string,
  clientName: string,
  serverName: string
) {
  const logFile = path.join(logDir, `session.${clientName}.${serverName}.log`);
  if (!fs.existsSync(logFile)) {
    console.log(
      `No log found for client ${clientName} and server ${serverName}.`
    );
    return;
  }

  spawn("tail", ["-f", logFile], { stdio: "inherit" });
}

async function removeSessionLogs(
  logDir: string,
  clientName?: string,
  serverName?: string
) {
  if (!fs.existsSync(logDir)) {
    console.log("No session logs found.");
    return;
  }

  if (!clientName && !serverName) {
    // Remove all session logs
    const files = fs
      .readdirSync(logDir)
      .filter((file) => file.startsWith("session.") && file.endsWith(".log"));

    if (files.length === 0) {
      console.log("No session logs found to remove.");
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to remove all ${files.length} session logs?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log("Operation cancelled.");
      return;
    }

    for (const file of files) {
      const filePath = path.join(logDir, file);
      fs.unlinkSync(filePath);
      console.log(`Removed: ${file}`);
    }
    console.log("All session logs have been removed.");
  } else if (clientName && serverName) {
    // Remove specific session log
    const logFile = path.join(
      logDir,
      `session.${clientName}.${serverName}.log`
    );
    if (!fs.existsSync(logFile)) {
      console.log(
        `No log found for client ${clientName} and server ${serverName}.`
      );
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to remove the log file for client ${clientName} and server ${serverName}?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log("Operation cancelled.");
      return;
    }

    fs.unlinkSync(logFile);
    console.log(`Removed: session.${clientName}.${serverName}.log`);
  } else {
    console.log(
      "Error: Both client name and server name are required for specific log removal."
    );
    return;
  }
}

function getViewerCommand(viewer: string, file: string): [string, string[]] {
  switch (viewer.toLowerCase()) {
    case "less":
      return ["less", [file]];
    case "tail":
      return ["tail", ["-f", file]];
    case "bat":
      return ["bat", ["--paging=always", file]];
    default:
      return ["less", [file]];
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
