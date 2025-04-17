import arg from "arg";
import { App } from "../../app";

const deleteCommandOptions = {};

export const deleteCommand = async (app: App, argv: string[]) => {
  const options = arg(deleteCommandOptions, { argv });

  const name = options["_"]?.[0];

  const registryService = app.getRegistryService();

  try {
    // First check if registry exists
    try {
      registryService.getRegistryDef(name);
    } catch {
      console.error(`Registry '${name}' not found`);
      process.exit(1);
    }

    registryService.deleteRegistryDef(name);

    console.log(`Successfully deleted registry '${name}'`);
  } catch (error) {
    console.error(
      `Failed to delete registry: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
};
