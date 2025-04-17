import arg from "arg";
import { App } from "../../app";
import { serverListCommand } from "./list";
import { serverLogsCommand } from "./logs";
import { serverStopCommand } from "./stop";

const serverCommandOptions = {};

export const serverCommand = async (app: App, argv: string[]) => {
  const options = arg(serverCommandOptions, { argv, stopAtPositional: true });

  const subArgv = options["_"];

  if (!subArgv || subArgv.length === 0) {
    console.error("Error: No command specified.");
    console.error("Available commands: list, logs, stop");
    process.exit(1);
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
      console.error("Unknown server command:", subCommand);
      console.log("Available commands: list, logs, stop");
      process.exit(1);
  }
};
