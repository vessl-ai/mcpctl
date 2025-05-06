import arg from "arg";
import { spawn } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { LOG_PATHS } from "../../../core/lib/constants/paths";
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
  const logDir = LOG_PATHS[process.platform as keyof typeof LOG_PATHS];
  const viewer = options["--viewer"] || "less";

  switch (subCommand) {
    case "list":
      await listDaemonLogs(logDir);
      break;
    case "view":
      await viewDaemonLogs(logDir, viewer);
      break;
    case "follow":
      await followDaemonLogs(logDir);
      break;
    case "remove":
      await removeDaemonLogs(logDir);
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

async function viewDaemonLogs(logDir: string, viewer: string) {
  // If log type is not specified, ask the user

  const logFile = path.join(logDir, "daemon.log");
  if (!fs.existsSync(logFile)) {
    console.log(`No daemon log found.`);
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

async function followDaemonLogs(logDir: string) {
  const logFile = path.join(logDir, "daemon.log");
  if (!fs.existsSync(logFile)) {
    console.log(`No daemon log found.`);
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

async function removeDaemonLogs(logDir: string) {
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
  if (targetFiles.length === 0) {
    console.log(`No daemon logs found to remove.`);
    return;
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
