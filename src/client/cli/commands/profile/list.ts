import { Command } from "commander";
import { App } from "../../app";

const buildProfileListCommand = (app: App): Command => {
  const profileListCommand = new Command("list")
    .description("List all profiles")
    .action(async () => {
      const profiles = app.getProfileService().listProfiles();
      console.log("Available profiles:");
      console.log("------------------");
      profiles.forEach(profile => {
        console.log(`\nProfile: ${profile.name}`);
        console.log("Servers:");
        Object.entries(profile.servers).forEach(([serverName, server]) => {
          console.log(`  - ${serverName}`);
          if (server.env && Object.keys(server.env).length > 0) {
            console.log("    Environment variables:");
            Object.entries(server.env).forEach(([key, value]) => {
              console.log(`      ${key}=${value}`);
            });
          }
        });
      });
    });

  return profileListCommand;
}

export { buildProfileListCommand };
