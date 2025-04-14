import chalk from "chalk";
import { Command } from "commander";
import { App } from "../../app";

const buildListCommand = (app: App): Command => {
  return new Command("list")
    .description("List all registered MCP registries")
    .action(async () => {
      const registryService = app.getRegistryService();
      const registries = registryService.listRegistryDefs();

      if (registries.length === 0) {
        console.log(chalk.yellow("No registries found."));
        return;
      }

      console.log(chalk.bold("\nRegistered MCP Registries:\n"));
      registries.forEach(registry => {
        console.log(chalk.bold.blue(registry.name));
        console.log(`  Type: ${chalk.cyan(registry.knownType)}`);
        console.log(`  URL:  ${chalk.green(registry.url)}\n`);
      });
    });
};

export { buildListCommand };
