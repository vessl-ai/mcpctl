import arg from "arg";
import { App } from "../../app";

const sessionStopCommandOptions = {
  "--session": String,
  "-s": "--session",
};

export const sessionStopCommand = async (app: App, argv: string[]) => {
  const options = arg(sessionStopCommandOptions, { argv });
  const sessionId = options["--session"];
  if (!sessionId) {
    console.error("Error: Session ID is required. Use -s or --session option.");
    process.exit(1);
  }

  console.log("Session stop command");
  const sessionManager = app.getSessionManager();
  await sessionManager.disconnect(sessionId, true);
};
