import arg from "arg";
import { App } from "../../app";

const profileListCommandOptions = {};

export const profileListCommand = async (app: App, argv: string[]) => {
  const options = arg(profileListCommandOptions, { argv });

  const profiles = app.getProfileService().listProfiles();
  console.log("Available profiles:");
  console.log("------------------");
  profiles.forEach((profile) => {
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
};
