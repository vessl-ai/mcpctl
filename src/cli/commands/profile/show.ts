import { Argument, Command } from "commander";
import { App } from "../../app";

const buildProfileShowCommand = (app: App): Command => {
  const profileShowCommand = new Command("show")
    .description("Show a profile")
    .addArgument(new Argument("name"))
    .action(async (name) => {
      const profile = app.getProfileService().getProfile(name);
      console.log("🔍 Profile Details:");
      console.log("==================");
      console.log(`Name: ${profile.name}`);
      console.log("\nServers:");
      console.log("--------");
      Object.entries(profile.servers).forEach(([serverName, server]) => {
        console.log(`\n📦 ${serverName}:`);
        console.log(`   Type: ${server.type}`);
        console.log(`   Command: ${server.command}`);
        console.log(`   Args: ${server.args.join(" ")}`);
        if (Object.keys(server.env).length > 0) {
          console.log("   Environment Variables:");
          Object.entries(server.env).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
          });
        }
      });
    });

  return profileShowCommand;
}

export { buildProfileShowCommand };
