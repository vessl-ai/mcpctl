import { Command } from "commander";
import { App } from "../../app";

const buildServerListCommand = (app: App): Command => {
  const serverListCommand = new Command("list")
    .description("List MCP server")
    .action(async () => {
      console.log("Server list command");
      const serverService = app.getServerService();
      const servers = await serverService.listServers();
      console.log(servers);
    });

  return serverListCommand;
}

export { buildServerListCommand };
