import { CliError } from "@mcpctl/lib";
import arg from "arg";
import { App } from "../../app";

const profileCreateCommandOptions = {};

export const profileCreateCommand = async (app: App, argv: string[]) => {
  const options = arg(profileCreateCommandOptions, { argv });

  const logger = app.getLogger();

  const name = options["_"]?.[0];

  if (!name) {
    logger.error("Error: Name is required.");
    throw new CliError("Error: Name is required.");
  }

  app.getProfileService().createProfile(name);
  console.log(`✨ Profile '${name}' created successfully!`);

  return profileCreateCommand;
};
