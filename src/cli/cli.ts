import arg from "arg";
import fs from "fs";
import path from "path";
import {
  Logger,
  LogLevel,
  newLogger,
  verboseToLogLevel,
} from "../lib/logger/logger";
import { VERSION } from "../version";
import { newApp } from "./app";
import { configCommand } from "./commands/config";
import { daemonCommand } from "./commands/daemon";
import deleteCommand from "./commands/delete";
import { installCommand } from "./commands/install";
import { listCommand } from "./commands/list";
import { logsCommand } from "./commands/logs";
import { mcpconfigCommand } from "./commands/mcpconfig";
import { profileCommand } from "./commands/profile";
import { registryCommand } from "./commands/registry";
import { searchCommand } from "./commands/search";
import { serverCommand } from "./commands/server";
import { sessionCommand } from "./commands/session";

const mainCommandOptions = {
  "--verbose": arg.COUNT,
  "-v": "--verbose",
  "--log-file": String,
  "--version": Boolean,
  "-V": "--version",
  "--stdout": Boolean,
  "--stderr": Boolean,
  "--help": Boolean,
  "-h": "--help",
};

const verboseConsoleLogger =
  (verbose: number | undefined) =>
  (message: string, ...args: any[]) => {
    if (verbose && verbose > 0) {
      console.log(message, ...args);
    }
  };

const main = async () => {
  const options = arg(mainCommandOptions, {
    argv: process.argv.slice(2),
    permissive: true,
  });
  const subArgv = options["_"];
  const verbose = options["--verbose"];
  const verboseLog = verboseConsoleLogger(verbose);
  let stdout = options["--stdout"] || false;
  let stderr = options["--stderr"] || false;

  if (!stdout && !stderr) {
    // default stream all logs to stdout
    stdout = true;
  }
  verboseLog("stdout", stdout);
  verboseLog("stderr", stderr);

  // Handle version flag
  if (options["--version"]) {
    console.log(`mcpctl version ${VERSION}`);
    console.log(`Node.js version ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
    process.exit(0);
  }

  const logFilePath =
    options["--log-file"] || process.env.MCPCTL_LOG_FILE || undefined;

  let logger: Logger;
  if (logFilePath) {
    verboseLog("logFilePath", logFilePath);
    if (!fs.existsSync(logFilePath)) {
      fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
    }
    logger = newLogger({
      logLevel: verbose ? LogLevel.VERBOSE : LogLevel.ERROR,
      logPath: logFilePath,
      console: {
        stdout: stdout,
        stderr: stderr,
      },
    });
  } else {
    logger = newLogger({
      logLevel: verboseToLogLevel(verbose, LogLevel.ERROR),
      console: {
        stdout: stdout,
        stderr: stderr,
      },
    });
  }

  const app = newApp({ logLevel: verboseToLogLevel(verbose), logger });
  await app.init();
  logger.debug("App initialized");
  logger.debug("SubArgv", subArgv);
  logger.debug("Options", options);

  if (subArgv.length === 0) {
    console.error("Error: No command specified.");
    console.error("\nAvailable commands:");
    console.error("  server\t\tManage MCP servers");
    console.error("  session\t\tManage MCP sessions");
    console.error("  install\t\tInstall MCP packages");
    console.error("  profile\t\tManage MCP profiles");
    console.error("  registry\t\tManage MCP registries");
    console.error("  search\t\tSearch for MCP packages");
    console.error("  daemon\t\tManage MCP daemon");
    console.error("  logs\t\tView MCP logs");
    console.error("  list\t\tList MCP servers");
    console.error("  delete\t\tDelete MCP server from client");
    console.error("  mcpconfig\t\tManage MCP configurations");
    console.error("  version\t\tShow version information");
    console.error("\nFor detailed help: mcpctl <command> --help");
    process.exit(1);
  }

  if (options["--help"]) {
    console.error("\nAvailable commands:");
    console.error("  server\t\tManage MCP servers");
    console.error("  session\t\tManage MCP sessions");
    console.error("  install\t\tInstall MCP packages");
    console.error("  profile\t\tManage MCP profiles");
    console.error("  registry\t\tManage MCP registries");
    console.error("  search\t\tSearch for MCP packages");
    console.error("  daemon\t\tManage MCP daemon");
    console.error("  logs\t\tView MCP logs");
    console.error("  list\t\tList MCP servers");
    console.error("  delete\t\tDelete MCP server from client");
    console.error("  mcpconfig\t\tManage MCP configurations");
    console.error("  version\t\tShow version information");
    return;
  }

  const mainCommand = subArgv[0];
  logger.debug("Main command", { mainCommand });

  try {
    switch (mainCommand) {
      case "version":
        console.log(`mcpctl version ${VERSION}`);
        console.log(`Node.js version ${process.version}`);
        console.log(`Platform: ${process.platform} ${process.arch}`);
        break;
      case "server": {
        await serverCommand(app, subArgv.slice(1));
        break;
      }
      case "session": {
        await sessionCommand(app, subArgv.slice(1));
        break;
      }
      case "install": {
        await installCommand(app, subArgv.slice(1));
        break;
      }
      case "profile": {
        await profileCommand(app, subArgv.slice(1));
        break;
      }
      case "registry": {
        await registryCommand(app, subArgv.slice(1));
        break;
      }
      case "search": {
        await searchCommand(app, subArgv.slice(1));
        break;
      }
      case "daemon": {
        await daemonCommand(app, subArgv.slice(1));
        break;
      }
      case "config": {
        await configCommand(app, subArgv.slice(1));
        break;
      }
      case "logs": {
        await logsCommand(app, subArgv.slice(1));
        break;
      }
      case "list": {
        await listCommand(app, subArgv.slice(1));
        break;
      }
      case "delete": {
        await deleteCommand(subArgv.slice(1));
        break;
      }
      case "mcpconfig": {
        await mcpconfigCommand(subArgv.slice(1));
        break;
      }
      default:
        console.error(`Error: '${mainCommand}' is an unknown command.`);
        console.error("\nAvailable commands:");
        console.error("  server\t\tManage MCP servers");
        console.error("  session\t\tManage MCP sessions");
        console.error("  install\t\tInstall MCP packages");
        console.error("  profile\t\tManage MCP profiles");
        console.error("  registry\t\tManage MCP registries");
        console.error("  search\t\tSearch for MCP packages");
        console.error("  daemon\t\tManage MCP daemon");
        console.error("  logs\t\tView MCP logs");
        console.error("  delete\t\tDelete MCP server from client");
        console.error("  mcpconfig\t\tManage MCP configurations");
        console.error("  version\t\tShow version information");
        console.error("\nFor detailed help: mcpctl <command> --help");
        process.exit(1);
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.error(
        "Daemon is not running, trying to start it by running `mcpctl daemon start`"
      );
    } else {
      if (!verbose) {
        console.error("\nAn error occurred. Use -v option for more details.");
      }
      if (verbose) {
        console.error(error);
      }
    }
    process.exit(1);
  }
};

main();
