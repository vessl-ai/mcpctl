import arg from "arg";
import { App } from "../../app";

const profileCreateCommandOptions = {};

export const profileCreateCommand = async (app: App, argv: string[]) => {
  const options = arg(profileCreateCommandOptions, { argv });

  const name = options["_"]?.[0];

  if (!name) {
    console.error("Error: Name is required.");
    process.exit(1);
  }

  app.getProfileService().createProfile(name);
  console.log(`✨ Profile '${name}' created successfully!`);

  return profileCreateCommand;
};
