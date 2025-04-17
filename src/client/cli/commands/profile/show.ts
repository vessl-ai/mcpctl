import arg from "arg";
import { App } from "../../app";

const profileShowCommandOptions = {};

export const profileShowCommand = async (app: App, argv: string[]) => {
  const options = arg(profileShowCommandOptions, { argv });

  const name = options["_"]?.[0];

  if (!name) {
    console.error("Error: Name is required.");
    process.exit(1);
  }

  const profile = app.getProfileService().getProfile(name);
  console.log("🔍 Profile Details:");
  console.log("==================");
  console.log(`Name: ${profile.name}`);
  console.log("\nServers:");
  console.log("--------");
  Object.entries(profile.servers).forEach(([serverName, server]) => {
    Object.entries(profile.servers).forEach(([serverName, server]) => {
      console.log(`\n📦 ${serverName}:`);
      console.log(`   Type: ${server.type}`);
      console.log(`   Command: ${server.command}`);
      console.log(`   Args: ${server.args?.join(" ")}`);
      if (server.env && Object.keys(server.env).length > 0) {
        console.log("   Environment Variables:");
        Object.entries(server.env).forEach(([key, value]) => {
          console.log(`   - ${key}: ${value}`);
        });
      }
    });
  });
};
