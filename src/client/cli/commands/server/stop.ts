import { Command } from "commander";
import { App } from "../../app";

const buildServerStopCommand = (app: App): Command => {
  const serverStopCommand = new Command("stop")
    .description("Stop MCP server")
    .argument("<instance>", "Instance ID")
    .action(async (instance) => {
      console.log("Server stop command");
      const serverService = app.getServerService();
      await serverService.stopServer(instance);
    });

  return serverStopCommand;
};

export { buildServerStopCommand };
