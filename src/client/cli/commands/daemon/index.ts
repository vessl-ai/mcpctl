import arg from "arg";
import { CliError } from "../../../../lib/errors";
import { App } from "../../app";
import { startCommand } from "./start";
import { statusCommand } from "./status";
import { stopCommand } from "./stop";

const daemonCommandOptions = {};

export const daemonCommand = async (app: App, argv: string[]) => {
  const options = arg(daemonCommandOptions, { argv });

  const subcommand = options["_"]?.[0];

  if (!subcommand) {
    console.log("Available subcommands:");
    console.log("  start   - Start the MCP daemon");
    console.log("  stop    - Stop the MCP daemon");
    console.log("  status  - Check the MCP daemon status");
    return;
  }

  switch (subcommand) {
    case "start":
      await startCommand(app);
      break;
    case "stop":
      await stopCommand(app, argv);
      break;
    case "status":
      await statusCommand(app);
      break;
    default:
      console.error(
        "Unknown subcommand. Available subcommands: start, stop, status"
      );
      throw new CliError(
        "Unknown subcommand. Available subcommands: start, stop, status"
      );
  }
};
