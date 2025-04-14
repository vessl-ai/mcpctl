import { Command } from "commander";
import { App } from "../../app";

const buildSessionListCommand = (app: App): Command => {
  const sessionListCommand = new Command("list")
    .description("List MCP server sessions")
    .action(async () => {
      console.log("Session list command");
      const sessionManager = app.getSessionManager();
      const sessions = await sessionManager.listSessions();
      console.log(sessions);
    });

  return sessionListCommand;
}

export { buildSessionListCommand };
