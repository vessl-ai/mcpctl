import { Command } from "commander";
import { App } from "../../app";

const buildSessionStopCommand = (app: App): Command => {
  const sessionStopCommand = new Command("stop")
    .description("Stop MCP server session")
    .action(async () => {
      console.log("Session stop command");
    });

  return sessionStopCommand;
}

export { buildSessionStopCommand };
