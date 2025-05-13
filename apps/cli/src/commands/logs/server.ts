import arg from "arg";
import { spawn } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { LOG_PATHS } from "../../../core/lib/constants/paths";
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
    console.log("  remove\tRemove server logs");
    return;
  }

  const subCommand = subArgv[0];
  const serverName = subArgv[1];
  const logDir = path.join(
    LOG_PATHS[process.platform as keyof typeof LOG_PATHS],
    "server-instances"
  );
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
    case "remove":
      await removeServerLogs(logDir, serverName, instance, profile);
      break;
    default:
      logger.error(`Error: '${subCommand}' is an unknown subcommand.`);
      console.log("Available subcommands:");
      console.log("  list\tList available server logs");
      console.log("  view\tView server logs");
      console.log("  follow\tFollow server logs in real-time");
      console.log("  remove\tRemove server logs");
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

  const { command, args } = getViewerCommand(viewer, logFile);
  if (viewer.toLowerCase() === "fzf") {
    // fzf의 경우 cat과 파이프로 연결
    const cat = spawn("cat", [logFile]);
    const fzf = spawn(command, args, { stdio: ["pipe", "inherit", "inherit"] });
    cat.stdout?.pipe(fzf.stdin!);
  } else {
    spawn(command, args, { stdio: "inherit" });
  }
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
      return { command: "fzf", args: [] };
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

async function removeServerLogs(
  logDir: string,
  serverName: string | undefined,
  instance: string | undefined,
  profile: string
) {
  if (!fs.existsSync(logDir)) {
    console.log("No server logs found.");
    return;
  }

  const files = fs.readdirSync(logDir).filter((file) => file.endsWith(".log"));

  if (files.length === 0) {
    console.log("No server logs found to remove.");
    return;
  }

  let targetFiles = files;
  if (serverName) {
    const baseName = `${serverName}-${profile}`;
    const instanceSuffix = instance ? `-${instance}` : "";
    const pattern = `${baseName}${instanceSuffix}.log`;
    targetFiles = files.filter((file) => file === pattern);
    if (targetFiles.length === 0) {
      console.log(
        `No server logs found for ${serverName}${
          instance ? ` instance ${instance}` : ""
        } with profile ${profile}.`
      );
      return;
    }
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Are you sure you want to remove ${targetFiles.length} server log file(s)?`,
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
  console.log("All selected server logs have been removed.");
}
