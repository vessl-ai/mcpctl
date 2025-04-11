import { Command } from "commander";
import { App } from "../app";

const buildConnectCommand = (app: App): Command => {
  const connectCommand = new Command("connect")
    .description("Connect to MCP server")
    .action(async () => {
      console.log("Connect command");
    });

  return connectCommand;
}

export { buildConnectCommand };
