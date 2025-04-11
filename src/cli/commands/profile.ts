import { Command } from "commander";
import { App } from "../app";


const buildProfileCommand = (app: App): Command => {
  const profileCommand = new Command("profile")
    .description("Manage MCP server profiles")
    .action(async () => {
      console.log("Profile command");
    });

  return profileCommand;
}

export { buildProfileCommand };
