import arg from "arg";
import { CliError } from "../../../lib/errors";
import { App } from "../../app";
import { serverListCommand } from "./list";
import { serverLogsCommand } from "./logs";
import { serverStopCommand } from "./stop";

const serverCommandOptions = {};

export const serverCommand = async (app: App, argv: string[]) => {
  const options = arg(serverCommandOptions, { argv, stopAtPositional: true });

  const subArgv = options["_"];

  const logger = app.getLogger();

  if (!subArgv || subArgv.length === 0) {
    logger.error("Error: No command specified.");
    logger.error("Available commands: list, logs, stop");
    throw new CliError("Error: No command specified.");
  }

  const subCommand = subArgv[0];

  switch (subCommand) {
    case "list":
      await serverListCommand(app, subArgv.slice(1));
      break;
    case "logs":
      await serverLogsCommand(app, subArgv.slice(1));
      break;
    case "stop":
      await serverStopCommand(app, subArgv.slice(1));
      break;
    default:
      logger.error("Unknown server command:", { subCommand });
      logger.error("Available commands: list, logs, stop");
      throw new CliError("Error: Unknown server command.");
  }
};
