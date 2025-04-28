import { RegistryDef, RegistryType } from "@mcpctl/core";
import { CliError, ValidationError } from "@mcpctl/lib";
import arg from "arg";
import { App } from "../../app";

const addCommandOptions = {};

export const addCommand = async (app: App, argv: string[]) => {
  const options = arg(addCommandOptions, { argv });

  const logger = app.getLogger();

  const name = options["_"]?.[0];
  const url = options["_"]?.[1];
  const type = options["_"]?.[2];

  if (!name) {
    logger.error("Error: Name is required.");
    throw new ValidationError("Error: Name is required.");
  }

  if (!url) {
    logger.error("Error: URL is required.");
    throw new ValidationError("Error: URL is required.");
  }

  if (!type) {
    logger.error("Error: Type is required.");
    throw new ValidationError("Error: Type is required.");
  }

  const registryService = app.getRegistryService();

  if (!Object.values(RegistryType).includes(type as RegistryType)) {
    logger.error(
      `Invalid registry type. Must be one of: ${Object.values(
        RegistryType
      ).join(", ")}`
    );
    throw new ValidationError(
      `Invalid registry type. Must be one of: ${Object.values(
        RegistryType
      ).join(", ")}`
    );
  }

  const newRegistry: RegistryDef = {
    name,
    url,
    knownType: type as RegistryType,
  };

  try {
    registryService.addRegistryDef(newRegistry);
    console.log(`Successfully added registry '${name}'`);
  } catch (error) {
    logger.error(
      `Failed to add registry: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw new CliError("Failed to add registry");
  }
};
