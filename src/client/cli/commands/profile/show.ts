import arg from "arg";
import { ResourceNotFoundError, ValidationError } from "../../../../lib/errors";
import { ServerConfig } from "../../../core/lib/types/config";
import { App } from "../../app";

const profileShowCommandOptions = {};

export const profileShowCommand = async (app: App, argv: string[]) => {
  const options = arg(profileShowCommandOptions, { argv });

  const logger = app.getLogger();

  const name = options["_"]?.[0];

  if (!name) {
    logger.error("Error: Name is required.");
    throw new ValidationError("Error: Name is required.");
  }

  const profile = app.getProfileService().getProfile(name);

  if (!profile) {
    logger.error(`Error: Profile '${name}' not found.`);
    throw new ResourceNotFoundError(`Error: Profile '${name}' not found.`);
  }

  console.log("🔍 Profile Details:");
  console.log("==================");
  console.log(`Name: ${profile.name}`);
  console.log("\nServers:");
  console.log("--------");

  Object.entries(profile.servers).forEach(([serverName, serverConfig]) => {
    const server = serverConfig as ServerConfig;
    console.log(`\n📦 ${serverName}:`);
    if (server.type) console.log(`   Type: ${server.type}`);
    if (server.command) console.log(`   Command: ${server.command}`);
    if (server.args?.length) console.log(`   Args: ${server.args.join(" ")}`);

    if (server.env?.env && Object.keys(server.env.env).length > 0) {
      console.log("   Environment Variables:");
      Object.entries(server.env.env).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value}`);
      });
    }

    if (server.env?.secrets && Object.keys(server.env.secrets).length > 0) {
      console.log("   Secrets:");
      Object.keys(server.env.secrets).forEach((key) => {
        console.log(`   - ${key}: [HIDDEN]`);
      });
    }
  });
};
