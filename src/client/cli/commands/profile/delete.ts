import arg from "arg";
import { App } from "../../app";

const profileDeleteCommandOptions = {};

export const profileDeleteCommand = async (app: App, argv: string[]) => {
  const options = arg(profileDeleteCommandOptions, { argv });

  const name = options["_"]?.[0];

  if (!name) {
    console.error("Error: Name is required.");
    process.exit(1);
  }

  app.getProfileService().deleteProfile(name);
  console.log(`✨ Profile '${name}' deleted successfully!`);
};
