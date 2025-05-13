import arg from "arg";
import { CliError } from "../../../lib/errors";
import { App } from "../../app";
import { clientLogsCommand } from "./client";
import { daemonLogsCommand } from "./daemon";
import { serverLogsCommand } from "./server";
import { sessionLogsCommand } from "./session";

const logsCommandOptions = {};

export const logsCommand = async (app: App, argv: string[]) => {
  const options = arg(logsCommandOptions, { argv, stopAtPositional: true });
  const subArgv = options["_"];
  const logger = app.getLogger();

  if (!subArgv || subArgv.length === 0) {
    console.log("Logs command");
    console.log("Available subcommands:");
    console.log("  daemon\tView daemon logs");
    console.log("  client\tView client logs");
    console.log("  server\tView server logs");
    console.log("  session\tView session logs");
    return;
  }

  const subCommand = subArgv[0];

  switch (subCommand) {
    case "daemon":
      await daemonLogsCommand(app, subArgv.slice(1));
      break;
    case "client":
      await clientLogsCommand(app, subArgv.slice(1));
      break;
    case "server":
      await serverLogsCommand(app, subArgv.slice(1));
      break;
    case "session":
      await sessionLogsCommand(app, subArgv.slice(1));
      break;
    default:
      logger.error(`Error: '${subCommand}' is an unknown subcommand.`);
      console.log("Available subcommands:");
      console.log("  daemon\tView daemon logs");
      console.log("  client\tView client logs");
      console.log("  server\tView server logs");
      console.log("  session\tView session logs");
      throw new CliError(`Error: '${subCommand}' is an unknown subcommand.`);
  }
};
