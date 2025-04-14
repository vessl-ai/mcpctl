import { Command } from "commander";
import { App } from "../../app";
import { buildServerListCommand } from "./list";
import { buildServerLogsCommand } from "./logs";
import { buildServerStopCommand } from "./stop";

const buildServerCommand = (app: App): Command => {
  const serverCommand = new Command("server")
    .description("Manage MCP server")
    .action(async () => {
      console.log("Server command");
    });

  serverCommand.addCommand(buildServerListCommand(app));
  serverCommand.addCommand(buildServerLogsCommand(app));
  serverCommand.addCommand(buildServerStopCommand(app));

  return serverCommand;
}

export { buildServerCommand };
