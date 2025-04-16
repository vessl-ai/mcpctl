import { App } from "../../app";

const buildServerStopCommand = (app: App) => {
  return {
    action: async (options: any) => {
      const instance = options.args?.[1];

      if (!instance) {
        console.error("Error: Instance ID is required.");
        console.error("Usage: mcpctl server stop <instance>");
        process.exit(1);
      }

      console.log("Server stop command");
      const serverService = app.getServerService();
      await serverService.stopServer(instance);
    },
  };
};

export { buildServerStopCommand };
