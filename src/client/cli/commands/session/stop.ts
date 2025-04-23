import arg from "arg";
import { ValidationError } from "../../../../lib/errors";
import { App } from "../../app";

const sessionStopCommandOptions = {
  "--session": String,
  "-s": "--session",
};

export const sessionStopCommand = async (app: App, argv: string[]) => {
  const options = arg(sessionStopCommandOptions, { argv });
  const sessionId = options["--session"];
  const logger = app.getLogger();

  if (!sessionId) {
    logger.error("Error: Session ID is required. Use -s or --session option.");
    throw new ValidationError("Error: Session ID is required.");
  }

  console.log("Session stop command");
  const sessionManager = app.getSessionManager();
  await sessionManager.disconnect(sessionId, true);
};
