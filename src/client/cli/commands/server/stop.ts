import { Command } from "commander";
import { App } from "../../app";

const buildServerStopCommand = (app: App): Command => {
  const serverStopCommand = new Command("stop")
    .description("Stop MCP server")
    .option("-i, --instance <instance>", "Instance ID")
    .action(async (options) => {
      console.log("Server stop command");
      const serverService = app.getServerService();
      await serverService.stopServer(options.instance);
    });

  return serverStopCommand;
}

export { buildServerStopCommand };
