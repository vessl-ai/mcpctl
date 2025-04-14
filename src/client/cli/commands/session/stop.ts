import { Command } from "commander";
import { App } from "../../app";

const buildSessionStopCommand = (app: App): Command => {
  const sessionStopCommand = new Command("stop")
    .description("Stop MCP server session")
    .option("-s, --session <session>", "Session ID")
    .action(async (options) => {
      console.log("Session stop command");
      const sessionManager = app.getSessionManager();
      await sessionManager.disconnect(options.session, true);
    });

  return sessionStopCommand;
}

export { buildSessionStopCommand };
