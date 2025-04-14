import { Command } from "commander";
import { App } from "../../app";
import { buildSessionConnectCommand } from "./connect";
import { buildSessionListCommand } from "./list";
import { buildSessionStopCommand } from "./stop";

const buildSessionCommand = (app: App): Command => {
  const sessionCommand = new Command("session")
    .description("Manage MCP server sessions")
    .action(async () => {
      console.log("Session command");
    });

  sessionCommand.addCommand(buildSessionListCommand(app));
  sessionCommand.addCommand(buildSessionStopCommand(app));
  sessionCommand.addCommand(buildSessionConnectCommand(app));
  return sessionCommand;
}

export { buildSessionCommand };
