import arg from "arg";
import { CliError, ValidationError } from "../../../lib/errors";
import { App } from "../../app";

const profileSetEnvCommandOptions = {
  "--server": String,
  "--env": [String],
  "-s": "--server",
  "-e": "--env",
};

export const profileSetEnvCommand = async (app: App, argv: string[]) => {
  // @ts-ignore
  const options = arg(profileSetEnvCommandOptions, { argv });

  const logger = app.getLogger();

  const subArgv = options["_"];
  const subCommand = subArgv?.[0];

  if (!subCommand) {
    logger.error("Error: No command specified.");
    logger.error("Available commands: set, get");
    throw new CliError("Error: No command specified.");
  }

  const name = options["_"]?.[0];
  const server = options["--server"];
  const env: string[] = options["--env"] || [];

  if (!name) {
    logger.error("Error: Name is required.");
    throw new ValidationError("Error: Name is required.");
  }

  if (!server) {
    logger.error("Error: Server is required.");
    throw new ValidationError("Error: Server is required.");
  }

  if (!env) {
    logger.error("Error: Environment variables are required.");
    throw new ValidationError("Error: Environment variables are required.");
  }

  const envPairs = env.map((e) => e.split("="));
  const envRecord = Object.fromEntries(envPairs);
  app.getProfileService().setServerEnvForProfile(name, server, envRecord);
};

const profileGetEnvCommandOptions = {
  "--server": String,
  "-s": "--server",
};

export const profileGetEnvCommand = async (app: App, argv: string[]) => {
  // @ts-ignore
  const options = arg(profileGetEnvCommandOptions, { argv });

  const logger = app.getLogger();

  const name = options["_"]?.[0];
  const server = options["--server"];

  if (!name) {
    logger.error("Error: Name is required.");
    throw new ValidationError("Error: Name is required.");
  }

  if (!server) {
    logger.error("Error: Server is required.");
    throw new ValidationError("Error: Server is required.");
  }

  const env =
    app.getProfileService().getProfile(name)?.servers[server].env ?? {};

  // Pretty print environment variables
  Object.entries(env).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
};
