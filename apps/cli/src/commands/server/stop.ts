import arg from "arg";
import { ValidationError } from "../../../lib/errors";
import { App } from "../../app";

const serverStopCommandOptions = {
  "--instance": String,
  "-i": "--instance",
};

export const serverStopCommand = async (app: App, argv: string[]) => {
  const options = arg(serverStopCommandOptions, { argv });

  const instance = options["--instance"];

  const logger = app.getLogger();

  if (!instance) {
    logger.error("Error: Instance ID is required.");
    console.log("Usage: mcpctl server stop <instance>");
    throw new ValidationError("Error: Instance ID is required.");
  }

  console.log("Server stop command");
  const serverService = app.getServerService();
  await serverService.stopServer(instance);
};
