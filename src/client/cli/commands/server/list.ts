import { Command } from "commander";
import { App } from "../../app";

const buildServerListCommand = (app: App): Command => {
  const serverListCommand = new Command("list")
    .description("List MCP server")
    .action(async () => {
      console.log("Server list command");
    });

  return serverListCommand;
}

export { buildServerListCommand };
