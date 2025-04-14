import { Command } from "commander";
import { McpServerHostingType } from "../../../../lib/types/hosting";
import { newRunConfig } from "../../../../lib/types/run-config";
import { App } from "../../app";
const buildSessionConnectCommand = (app: App): Command => {
  const connectCommand = new Command("connect")
    .description("Connect to MCP server")
    .option("-s, --server <server>", "Server name")
    .option("-p, --profile <profile>", "Profile name")
    .option("-c, --command <command>", "Command to run")

  connectCommand.action(async (options) => {
    console.log("Connect command", options);
    const sessionManager = app.getSessionManager();
    const session = await sessionManager.connect(
      newRunConfig({
        hosting: McpServerHostingType.LOCAL, // TODO: Make this configurable
        serverName: options.server,
        profileName: options.profile,
        command: options.command,
        created: new Date().toISOString(),
      })
    );
    console.log("Session created", session);
  });

  return connectCommand;
}

export { buildSessionConnectCommand };
