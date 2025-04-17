import arg from "arg";
import { RegistryDef, RegistryType } from "../../../core/lib/types/registry";
import { App } from "../../app";

const addCommandOptions = {};

export const addCommand = async (app: App, argv: string[]) => {
  const options = arg(addCommandOptions, { argv });

  const name = options["_"]?.[0];
  const url = options["_"]?.[1];
  const type = options["_"]?.[2];

  if (!name) {
    console.error("Error: Name is required.");
    process.exit(1);
  }

  if (!url) {
    console.error("Error: URL is required.");
    process.exit(1);
  }

  if (!type) {
    console.error("Error: Type is required.");
    process.exit(1);
  }

  const registryService = app.getRegistryService();

  if (!Object.values(RegistryType).includes(type as RegistryType)) {
    console.error(
      `Invalid registry type. Must be one of: ${Object.values(
        RegistryType
      ).join(", ")}`
    );
    process.exit(1);
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
    console.error(
      `Failed to add registry: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
};
