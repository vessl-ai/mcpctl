import { Command } from "commander";
import { App } from "../../app";
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

  return sessionCommand;
}

export { buildSessionCommand };
