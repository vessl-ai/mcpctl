import { Argument, Command } from "commander";
import { App } from "../../app";

const buildProfileDeleteCommand = (app: App): Command => {
  const profileDeleteCommand = new Command("delete")
    .description("Delete a profile")
    .addArgument(new Argument("name", "The name of the profile to delete"))
    .action(async (name) => {
      app.getProfileService().deleteProfile(name);
      console.log(`✨ Profile '${name}' deleted successfully!`);
    });

  return profileDeleteCommand;
}

export { buildProfileDeleteCommand };
