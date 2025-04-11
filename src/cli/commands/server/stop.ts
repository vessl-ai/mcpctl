import { Command } from "commander";
import { App } from "../../app";

const buildServerStopCommand = (app: App): Command => {
  const serverStopCommand = new Command("stop")
    .description("Stop MCP server")
    .action(async () => {
      console.log("Server stop command");
    });

  return serverStopCommand;
}

export { buildServerStopCommand };
