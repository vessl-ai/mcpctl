import { App } from "../../app";

const buildSessionListCommand = (app: App) => {
  return {
    action: async (options: any) => {
      console.log("Session list command");
      const sessionManager = app.getSessionManager();
      const sessions = await sessionManager.listSessions();
      console.log(sessions);
    },
  };
};

export { buildSessionListCommand };
