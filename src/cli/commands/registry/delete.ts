import { Command } from "commander";
import { App } from "../../app";

const buildDeleteCommand = (app: App): Command => {
  return new Command("delete")
    .description("Delete a registered MCP registry")
    .argument("<name>", "Name of the registry to delete")
    .action(async (name: string) => {
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
        console.error(`Failed to delete registry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
};

export { buildDeleteCommand };
