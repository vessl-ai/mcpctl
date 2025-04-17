import arg from "arg";
import { spawn } from "child_process";
import { McpServerHostingType } from "../../../../lib/types/hosting";
import { App } from "../../app";

const sessionConnectCommandOptions = {
  "--server": String,
  "--command": String,
  "--profile": String,
  "-s": "--server",
  "-c": "--command",
  "-p": "--profile",
};

export const sessionConnectCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--server": String,
      "--command": String,
      "--command-base64": String,
      "--profile": String,
      "-s": "--server",
      "-c": "--command",
      "-c64": "--command-base64",
      "-p": "--profile",
    },
    { argv }
  );

  const logger = app.getLogger();
  logger.info("Session connect command", { options });

  if (!options["--server"]) {
    logger.error("Error: Server name is required. Use -s or --server option.");
    process.exit(1);
  }

  if (!options["--command"] && !options["--command-base64"]) {
    logger.error("Error: Command is required. Use -c or --command option.");
    process.exit(1);
  }

  const serverName = options["--server"];
  let command = options["--command"];
  if (options["--command-base64"]) {
    command = Buffer.from(options["--command-base64"], "base64").toString();
    command = command.trim();
  }
  if (!command) {
    logger.error("Something went wrong with command decoding", {
      command: options["--command-base64"],
    });
    process.exit(1);
  }
  const profileName = options["--profile"] || "default";

  logger.info("Connect command", { serverName, profileName, command });
  const sessionManager = app.getSessionManager();
  logger.info("Connecting to session manager");
  logger.info("Command", { command });
  const session = await sessionManager.connect({
    hosting: McpServerHostingType.LOCAL, // TODO: Make this configurable
    serverName,
    profileName,
    command: command,
    created: new Date().toISOString(),
  });

  // ------ MUST log to logger from here -----
  logger.info("Session created", session);

  const connectionUrl = `${session.connectionInfo.baseUrl}${session.connectionInfo.endpoint}`;
  logger.info("Connecting to " + connectionUrl);

  const child = spawn(`npx`, ["-y", "supergateway", "--sse", connectionUrl], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  child.on("exit", (code, signal) => {
    logger.info(`Child process exited with code ${code} and signal ${signal}`);
  });

  child.on("error", (error) => {
    logger.error("Child process error", error);
  });

  const kill = async () => {
    logger.info("Received termination signal, cleaning up...");
    await sessionManager.disconnect(session.id, false);
    logger.info("Session disconnected");
    child.kill();
  };

  process.on("SIGINT", kill);
  process.on("SIGTERM", kill);
  child.stdout!.pipe(process.stdout);
  child.stderr!.pipe(process.stderr);
  process.stdin.pipe(child.stdin!);

  logger.info("Session connected");
};
