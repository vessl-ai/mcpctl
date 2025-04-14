import { Command } from "commander";
import { App } from "../../app";

const buildServerLogsCommand = (app: App): Command => {
  const serverLogsCommand = new Command("logs")
    .description("Get MCP server logs")
    .action(async () => {
      console.log("Server logs command");
    });

  return serverLogsCommand;
}

export { buildServerLogsCommand };
