import { App } from "../../app";

const buildServerLogsCommand = (app: App) => {
  return {
    action: async (options: any) => {
      console.log("Server logs command");
    },
  };
};

export { buildServerLogsCommand };
