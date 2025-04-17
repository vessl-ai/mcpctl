import arg from "arg";
import { App } from "../../app";

const serverStopCommandOptions = {
  "--instance": String,
  "-i": "--instance",
};

export const serverStopCommand = async (app: App, argv: string[]) => {
  const options = arg(serverStopCommandOptions, { argv });

  const instance = options["--instance"];

  if (!instance) {
    console.error("Error: Instance ID is required.");
    console.error("Usage: mcpctl server stop <instance>");
    process.exit(1);
  }

  console.log("Server stop command");
  const serverService = app.getServerService();
  await serverService.stopServer(instance);
};
