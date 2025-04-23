import arg from "arg";
import fs from "fs";
import path from "path";
import { newConsoleLogger } from "../../lib/logger/console-logger";
import { newFileLogger } from "../../lib/logger/file-logger";
import { Logger, LogLevel, verboseToLogLevel } from "../../lib/logger/logger";
import { newApp } from "./app";
import { configCommand } from "./commands/config";
import { daemonCommand } from "./commands/daemon";
import { installCommand } from "./commands/install";
import { profileCommand } from "./commands/profile";
import { registryCommand } from "./commands/registry";
import { searchCommand } from "./commands/search";
import { serverCommand } from "./commands/server";
import { sessionCommand } from "./commands/session";
const mainCommandOptions = {
  "--verbose": arg.COUNT,
  "-v": "--verbose",
  "--log-file": String,
};

const verboseConsoleLogger =
  (verbose: number | undefined) =>
  (message: string, ...args: any[]) => {
    if (verbose && verbose >= 0) {
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

  const logFilePath =
    options["--log-file"] || process.env.MCPCTL_LOG_FILE || undefined;

  let logger: Logger;
  if (logFilePath) {
    verboseLog("logFilePath", logFilePath);
    if (!fs.existsSync(logFilePath)) {
      fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
    }
    logger = newFileLogger({
      filePath: logFilePath,
      logLevel: verbose ? LogLevel.VERBOSE : LogLevel.ERROR,
    });
  } else {
    logger = newConsoleLogger({
      logLevel: verboseToLogLevel(verbose, LogLevel.ERROR),
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
    console.error("\nFor detailed help: mcpctl <command> --help");
    process.exit(1);
  }

  const mainCommand = subArgv[0];
  logger.debug("Main command", { mainCommand });

  try {
    switch (mainCommand) {
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
