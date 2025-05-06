import arg from "arg";
import { spawn } from "child_process";
import { ServerEnvConfig } from "../../../core/lib/types/config";
import { SecretReference } from "../../../core/lib/types/secret";
import { ValidationError } from "../../../lib/errors";
import { McpServerHostingType } from "../../../lib/types/hosting";
import { App } from "../../app";

export const sessionConnectCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--server": String,
      "--command": String,
      "--command-base64": String,
      "--profile": String,
      "--env": [String],
      "--secret": [String],
      "--help": Boolean,
      "-s": "--server",
      "-c": "--command",
      "-c64": "--command-base64",
      "-p": "--profile",
      "-e": "--env",
      "-x": "--secret",
      "-h": "--help",
    },
    { argv }
  );

  const logger = app.getLogger();
  logger.info("Session connect command", { options });

  if (options["--help"]) {
    logger.info("Session connect command");
    logger.info(
      "Usage: mcp session connect --server <server> --command <command> [--command-base64 <command-base64>]"
    );
    logger.info("Options:");
    logger.info("  -s, --server: Server name");
    logger.info("  -c, --command: Command to run");
    logger.info(
      "  -c64, --command-base64: Command to run (base64 encoded, since cursor parses mcp.json wrong)"
    );
    logger.info("  -p, --profile: Profile name");
    logger.info("  -e, --env: Environment variables (key=value)");
    logger.info("  -x, --secret: Secret (key=value)");
    logger.info("  -h, --help: Show help");
    return;
  }

  if (!options["--server"]) {
    logger.error("Error: Server name is required. Use -s or --server option.");
    throw new ValidationError("Error: Server name is required.");
  }

  if (!options["--command"] && !options["--command-base64"]) {
    logger.error("Error: Command is required. Use -c or --command option.");
    throw new ValidationError("Error: Command is required.");
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
    throw new ValidationError(
      "Error: Something went wrong with command decoding."
    );
  }
  const profileName = options["--profile"] || "default";
  const env = options["--env"] || [];
  const secret = options["--secret"] || [];
  let envMap: ServerEnvConfig = await getAndUpdateServerEnv(
    app,
    profileName,
    serverName,
    env
  );

  const secretMap: Record<string, SecretReference> = {};
  secret.forEach((s) => {
    const [key, ref] = s.split("=");
    secretMap[key] = {
      key: ref,
    };
  });
  envMap = {
    env: envMap.env,
    secrets: { ...envMap.secrets, ...secretMap },
  };

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
    env: envMap.env,
    secrets: envMap.secrets,
  });

  // ------ MUST log to logger from here -----
  logger.info("Session created", session);

  const connectionUrl = `${session.connectionInfo.baseUrl}${session.connectionInfo.endpoint}`;
  logger.info("Connecting to " + connectionUrl);

  // Buffer to store stdin data before connection
  const stdinBuffer: Buffer[] = [];
  let isConnected = false;
  let isTerminated = false;

  const child = spawn(
    `npx`,
    ["-y", "supergateway", "--sse", connectionUrl, "--stderr"],
    {
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  // Start collecting stdin data
  process.stdin.on("data", (chunk) => {
    logger.info("Stdin pipe data", { chunk });
    child.stdin!.write(chunk);
  });

  // Add data validation for stdout
  child.stdout!.on("data", (data) => {
    logger.info("Stdout pipe data", { data: data.toString() });
    process.stdout.write(data);
  });

  child.stderr!.on("data", (data) => {
    logger.error("supergateway stderr", { data: data.toString() });
  });

  child.on("error", (error) => {
    logger.error("child on error", { error: error.message });
  });

  child.on("exit", (code, signal) => {
    isTerminated = true;
    logger.error(
      `supergateway process exited with code ${code} and signal ${signal}`
    );
    kill();
  });

  const kill = async () => {
    logger.info("Received termination signal, cleaning up...");
    isTerminated = true;
    await sessionManager.disconnect(session.id, false);
    logger.info("Session disconnected");
    child.kill();
  };

  process.on("SIGINT", kill);
  process.on("SIGTERM", kill);
  child.stdout!.pipe(process.stdout);
  child.stderr!.pipe(process.stderr);

  logger.info("Session connected");
};

async function getAndUpdateServerEnv(
  app: App,
  profileName: string,
  serverName: string,
  env: string[]
): Promise<ServerEnvConfig> {
  let newEnvMap: Record<string, string> = {};
  const profileService = app.getProfileService();

  // Get profile env config (includes both env and secret refs)
  const profileEnvConfig = await profileService.getProfileEnvForServer(
    profileName,
    serverName
  );

  // Add new env variables from command line
  if (env.length > 0) {
    env.forEach((e) => {
      const [key, value] = e.split("=");
      newEnvMap[key] = value;
    });
  }

  // Update profile with new env variables
  await profileService.upsertProfileEnvForServer(
    profileName,
    serverName,
    newEnvMap
  );

  // get shared env and secrets
  const sharedEnv = app.getConfigService().getConfigSection("sharedEnv");

  // Return combined env config
  return {
    env: { ...sharedEnv, ...profileEnvConfig.env, ...newEnvMap },
    secrets: profileEnvConfig.secrets || {},
  };
}
