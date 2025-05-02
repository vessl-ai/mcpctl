import arg from "arg";
import { spawn } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { CliError } from "../../../lib/errors";
import { App } from "../../app";

const daemonLogsCommandOptions = {
  "--viewer": String,
  "--type": String,
  "-v": "--viewer",
  "-t": "--type",
};

export const daemonLogsCommand = async (app: App, argv: string[]) => {
  const options = arg(daemonLogsCommandOptions, {
    argv,
    stopAtPositional: true,
  });
  const subArgv = options["_"];
  const logger = app.getLogger();

  if (!subArgv || subArgv.length === 0) {
    console.log("Daemon logs command");
    console.log("Available subcommands:");
    console.log("  list\tList available daemon logs");
    console.log("  view\tView daemon logs");
    console.log("  follow\tFollow daemon logs in real-time");
    console.log("  remove\tRemove daemon logs");
    return;
  }

  const subCommand = subArgv[0];
  const logDir = "/var/log/mcpctl";
  const logType = options["--type"] || "error";
  const viewer = options["--viewer"] || "less";

  switch (subCommand) {
    case "list":
      await listDaemonLogs(logDir);
      break;
    case "view":
      await viewDaemonLogs(logDir, logType, viewer);
      break;
    case "follow":
      await followDaemonLogs(logDir, logType);
      break;
    case "remove":
      await removeDaemonLogs(logDir, logType);
      break;
    default:
      logger.error(`Error: '${subCommand}' is an unknown subcommand.`);
      console.log("Available subcommands:");
      console.log("  list\tList available daemon logs");
      console.log("  view\tView daemon logs");
      console.log("  follow\tFollow daemon logs in real-time");
      console.log("  remove\tRemove daemon logs");
      throw new CliError(`Error: '${subCommand}' is an unknown subcommand.`);
  }
};

async function listDaemonLogs(logDir: string) {
  console.log("logDir", logDir);
  if (!fs.existsSync(logDir)) {
    console.log("No daemon logs found.");
    return;
  }

  const files = fs
    .readdirSync(logDir)
    .filter((file) => file.startsWith("daemon"))
    .map((file) => {
      const stats = fs.statSync(path.join(logDir, file));
      return {
        name: file,
        size: formatFileSize(stats.size),
        modified: stats.mtime,
      };
    });

  console.log("Available daemon logs:");
  files.forEach((file) => {
    console.log(
      `- ${file.name} (${
        file.size
      }, modified ${file.modified.toLocaleString()})`
    );
  });
}

async function viewDaemonLogs(logDir: string, logType: string, viewer: string) {
  // If log type is not specified, ask the user
  if (logType === "log") {
    const { selectedLogType } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedLogType",
        message: "Which log file would you like to view?",
        choices: [
          { name: "daemon.log (Main log)", value: "log" },
          { name: "daemon.error.log (Error log)", value: "error" },
        ],
      },
    ]);

    logType = selectedLogType;
  }

  const logFile = path.join(
    logDir,
    logType === "log" ? "daemon.log" : `daemon.${logType}.log`
  );
  if (!fs.existsSync(logFile)) {
    console.log(`No daemon ${logType} log found.`);
    return;
  }

  const { command, args } = getViewerCommand(viewer, logFile);
  const child = spawn(command, args, {
    stdio: ["inherit", "inherit", "inherit"],
  });

  // Wait for the child process to exit
  await new Promise<void>((resolve) => {
    child.on("exit", () => {
      resolve();
    });
  });
}

async function followDaemonLogs(logDir: string, logType: string) {
  const logFile = path.join(logDir, `daemon.${logType}.log`);
  if (!fs.existsSync(logFile)) {
    console.log(`No daemon ${logType} log found.`);
    return;
  }

  spawn("tail", ["-f", logFile], { stdio: "inherit" });
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

async function removeDaemonLogs(logDir: string, logType: string | undefined) {
  if (!fs.existsSync(logDir)) {
    console.log("No daemon logs found.");
    return;
  }

  const files = fs
    .readdirSync(logDir)
    .filter((file) => file.startsWith("daemon"));

  if (files.length === 0) {
    console.log("No daemon logs found to remove.");
    return;
  }

  let targetFiles = files;
  if (logType) {
    targetFiles = files.filter((file) => file === `daemon.${logType}.log`);
    if (targetFiles.length === 0) {
      console.log(`No daemon ${logType} logs found to remove.`);
      return;
    }
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Are you sure you want to remove ${targetFiles.length} daemon log file(s)?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log("Operation cancelled.");
    return;
  }

  for (const file of targetFiles) {
    const filePath = path.join(logDir, file);
    fs.unlinkSync(filePath);
    console.log(`Removed: ${file}`);
  }
  console.log("All selected daemon logs have been removed.");
}
