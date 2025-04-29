import arg from "arg";
import { spawn } from "child_process";
import fs from "fs";
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
  const sessionId = subArgv[1];
  const logDir = path.join(os.homedir(), ".mcpctl", "logs");
  const viewer = options["--viewer"] || "less";

  if (!sessionId && subCommand !== "list") {
    logger.error("Error: Session ID is required.");
    throw new CliError("Error: Session ID is required.");
  }

  switch (subCommand) {
    case "list":
      await listSessionLogs(logDir);
      break;
    case "view":
      await viewSessionLogs(logDir, sessionId, viewer);
      break;
    case "follow":
      await followSessionLogs(logDir, sessionId);
      break;
    default:
      logger.error(`Error: '${subCommand}' is an unknown subcommand.`);
      console.log("Available subcommands:");
      console.log("  list\tList available session logs");
      console.log("  view\tView session logs");
      console.log("  follow\tFollow session logs in real-time");
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
    .filter((file) => file.startsWith("session-") && file.endsWith(".log"))
    .map((file) => {
      const stats = fs.statSync(path.join(logDir, file));
      return {
        name: file,
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
  logDir: string,
  sessionId: string,
  viewer: string
) {
  const logFile = path.join(logDir, `session-${sessionId}.log`);
  if (!fs.existsSync(logFile)) {
    console.log(`No log found for session ${sessionId}.`);
    return;
  }

  const viewerCommand = getViewerCommand(viewer, logFile);
  spawn(viewerCommand, [], { stdio: "inherit" });
}

async function followSessionLogs(logDir: string, sessionId: string) {
  const logFile = path.join(logDir, `session-${sessionId}.log`);
  if (!fs.existsSync(logFile)) {
    console.log(`No log found for session ${sessionId}.`);
    return;
  }

  spawn("tail", ["-f", logFile], { stdio: "inherit" });
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
