import { App } from "../../app";

const buildSessionStopCommand = (app: App) => {
  return {
    action: async (options: any) => {
      const sessionId = options.s || options.session;

      if (!sessionId) {
        console.error(
          "Error: Session ID is required. Use -s or --session option."
        );
        process.exit(1);
      }

      console.log("Session stop command");
      const sessionManager = app.getSessionManager();
      await sessionManager.disconnect(sessionId, true);
    },
  };
};

export { buildSessionStopCommand };
