import { Command } from "commander";
import { App } from "../../app";
import { buildProfileCreateCommand } from "./create";
import { buildProfileDeleteCommand } from "./delete";
import { buildProfileEnvCommand } from "./env";
import { buildProfileListCommand } from "./list";
import { buildProfileShowCommand } from "./show";

const buildProfileCommand = (app: App): Command => {
  const profileCommand = new Command("profile")
    .description("Manage MCP server profiles")
    .action(async () => {
      console.log("Profile command");
    });

  profileCommand.addCommand(buildProfileCreateCommand(app));
  profileCommand.addCommand(buildProfileListCommand(app));
  profileCommand.addCommand(buildProfileEnvCommand(app));
  profileCommand.addCommand(buildProfileShowCommand(app));
  profileCommand.addCommand(buildProfileDeleteCommand(app));
  return profileCommand;
}

export { buildProfileCommand };
