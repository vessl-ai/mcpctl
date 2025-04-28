import arg from "arg";
import { App } from "../../app";
import { sessionConnectCommand } from "./connect";
import { sessionListCommand } from "./list";
import { sessionStopCommand } from "./stop";

const sessionCommandOptions = {};

export const sessionCommand = async (app: App, argv: string[]) => {
  const options = arg(sessionCommandOptions, { argv, stopAtPositional: true });

  const subArgv = options["_"];
  const logger = app.getLogger();
  logger.debug("Session command", { options });

  if (!subArgv || subArgv.length === 0) {
    console.log("Session command");
    console.log("Available subcommands:");
    console.log("  list\t\tList MCP server sessions");
    console.log("  stop\t\tStop MCP server sessions");
    console.log("  connect\tConnect to MCP server");
    return;
  }
  const subCommand = subArgv[0];

  switch (subCommand) {
    case "list":
      await sessionListCommand(app, subArgv);
      break;
    case "stop":
      await sessionStopCommand(app, subArgv);
      break;
    case "connect":
      await sessionConnectCommand(app, subArgv);
      break;
    default:
      console.error(`Error: '${subCommand}' is an unknown subcommand.`);
      console.log("Available subcommands:");
      console.log("  list\t\tList MCP server sessions");
      console.log("  stop\t\tStop MCP server sessions");
      console.log("  connect\tConnect to MCP server");
      return;
  }
};
