import arg from "arg";
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

  const subArgv = options["_"];
  const subCommand = subArgv?.[0];

  if (!subCommand) {
    console.error("Error: No command specified.");
    console.error("Available commands: set, get");
    process.exit(1);
  }

  const name = options["_"]?.[0];
  const server = options["--server"];
  const env: string[] = options["--env"] || [];

  if (!name) {
    console.error("Error: Name is required.");
    process.exit(1);
  }

  if (!server) {
    console.error("Error: Server is required.");
    process.exit(1);
  }

  if (!env) {
    console.error("Error: Environment variables are required.");
    process.exit(1);
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

  const name = options["_"]?.[0];
  const server = options["--server"];

  if (!name) {
    console.error("Error: Name is required.");
    process.exit(1);
  }

  if (!server) {
    console.error("Error: Server is required.");
    process.exit(1);
  }

  const env = app.getProfileService().getProfile(name).servers[server].env;
  console.log(env);
};
