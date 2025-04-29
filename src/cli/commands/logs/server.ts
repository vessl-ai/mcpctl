import arg from "arg";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { CliError } from "../../../lib/errors";
import { App } from "../../app";

const serverLogsCommandOptions = {
  "--viewer": String,
  "--instance": String,
  "--profile": String,
  "-v": "--viewer",
  "-i": "--instance",
  "-p": "--profile",
};

export const serverLogsCommand = async (app: App, argv: string[]) => {
  const options = arg(serverLogsCommandOptions, {
    argv,
    stopAtPositional: true,
  });
  const subArgv = options["_"];
  const logger = app.getLogger();

  if (!subArgv || subArgv.length === 0) {
    console.log("Server logs command");
    console.log("Available subcommands:");
    console.log("  list\tList available server logs");
    console.log("  view\tView server logs");
    console.log("  follow\tFollow server logs in real-time");
    return;
  }

  const subCommand = subArgv[0];
  const serverName = subArgv[1];
  const logDir = path.join("/var/log", "mcpctl", "server-instances");
  const viewer = options["--viewer"] || "less";
  const instance = options["--instance"];
  const profile = options["--profile"] || "default";

  if (!serverName && subCommand !== "list") {
    logger.error("Error: Server name is required.");
    throw new CliError("Error: Server name is required.");
  }

  switch (subCommand) {
    case "list":
      await listServerLogs(logDir);
      break;
    case "view":
      await viewServerLogs(logDir, serverName, instance, profile, viewer);
      break;
    case "follow":
      await followServerLogs(logDir, serverName, instance, profile);
      break;
    default:
      logger.error(`Error: '${subCommand}' is an unknown subcommand.`);
      console.log("Available subcommands:");
      console.log("  list\tList available server logs");
      console.log("  view\tView server logs");
      console.log("  follow\tFollow server logs in real-time");
      throw new CliError(`Error: '${subCommand}' is an unknown subcommand.`);
  }
};

async function listServerLogs(logDir: string) {
  console.log("logDir", logDir);
  if (!fs.existsSync(logDir)) {
    console.log("No server logs found.");
    return;
  }

  const files = fs
    .readdirSync(logDir)
    .filter((file) => file.endsWith(".log"))
    .map((file) => {
      const stats = fs.statSync(path.join(logDir, file));
      return {
        name: file,
        size: formatFileSize(stats.size),
        modified: stats.mtime,
      };
    });

  console.log("Available server logs:");
  files.forEach((file) => {
    console.log(
      `- ${file.name} (${
        file.size
      }, modified ${file.modified.toLocaleString()})`
    );
  });
}

async function viewServerLogs(
  logDir: string,
  serverName: string,
  instance: string | undefined,
  profile: string,
  viewer: string
) {
  const logFile = getServerLogPath(logDir, serverName, instance, profile);
  if (!fs.existsSync(logFile)) {
    console.log(`No log found for server ${serverName}.`);
    return;
  }

  const viewerCommand = getViewerCommand(viewer, logFile);
  spawn(viewerCommand, [], { stdio: "inherit" });
}

async function followServerLogs(
  logDir: string,
  serverName: string,
  instance: string | undefined,
  profile: string
) {
  const logFile = getServerLogPath(logDir, serverName, instance, profile);
  if (!fs.existsSync(logFile)) {
    console.log(`No log found for server ${serverName}.`);
    return;
  }

  spawn("tail", ["-f", logFile], { stdio: "inherit" });
}

function getServerLogPath(
  logDir: string,
  serverName: string,
  instance: string | undefined,
  profile: string
): string {
  const baseName = `${serverName}-${profile}`;
  const instanceSuffix = instance ? `-${instance}` : "";
  return path.join(logDir, `${baseName}${instanceSuffix}.log`);
}

function getViewerCommand(viewer: string, file: string): string {
  switch (viewer.toLowerCase()) {
    case "less":
      return `less ${file}`;
    case "tail":
      return `tail -f ${file}`;
    case "bat":
      return `bat --paging=always ${file}`;
    case "fzf":
      return `cat ${file} | fzf`;
    default:
      return `less ${file}`;
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
