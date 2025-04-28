import { Profile, ServerConfig } from "@mcpctl/core";
import arg from "arg";
import { App } from "../../app";

const profileListCommandOptions = {};

export const profileListCommand = async (app: App, argv: string[]) => {
  const options = arg(profileListCommandOptions, { argv });

  const logger = app.getLogger();

  const profiles = app.getProfileService().listProfiles();
  console.log("📋 Available profiles:");
  console.log("====================");

  profiles.forEach((profile: Profile) => {
    console.log(`\n🔍 Profile: ${profile.name}`);
    console.log("Servers:");
    console.log("--------");

    Object.entries(profile.servers).forEach(([serverName, serverConfig]) => {
      const server = serverConfig as ServerConfig;
      console.log(`  📦 ${serverName}`);

      if (server.env?.env && Object.keys(server.env.env).length > 0) {
        console.log("    Environment Variables:");
        Object.entries(server.env.env).forEach(([key, value]) => {
          console.log(`      - ${key}: ${value}`);
        });
      }

      if (server.env?.secrets && Object.keys(server.env.secrets).length > 0) {
        console.log("    Secrets:");
        Object.keys(server.env.secrets).forEach((key) => {
          console.log(`      - ${key}: [HIDDEN]`);
        });
      }
    });
  });
};
