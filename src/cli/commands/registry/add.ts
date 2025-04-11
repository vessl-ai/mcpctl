import { Command } from "commander";
import { RegistryDef, RegistryType } from "../../../core/registry/registry";
import { App } from "../../app";

const buildAddCommand = (app: App): Command => {
  return new Command("add")
    .description("Add a new MCP registry")
    .argument("<name>", "Name of the registry")
    .argument("<url>", "URL of the registry")
    .argument("<type>", `Type of the registry (${Object.values(RegistryType).join(", ")})`)
    .action(async (name: string, url: string, type: string) => {
      const registryService = app.getRegistryService();

      // Validate registry type
      if (!Object.values(RegistryType).includes(type as RegistryType)) {
        console.error(`Invalid registry type. Must be one of: ${Object.values(RegistryType).join(", ")}`);
        process.exit(1);
      }

      const newRegistry: RegistryDef = {
        name,
        url,
        knownType: type as RegistryType
      };

      try {
        registryService.addRegistryDef(newRegistry);
        console.log(`Successfully added registry '${name}'`);
      } catch (error) {
        console.error(`Failed to add registry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
};

export { buildAddCommand };
