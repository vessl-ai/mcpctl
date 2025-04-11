import { Command } from "commander";
import { App } from "../app";

const buildRegistryCommand = (app: App): Command => {

  const registryCommand = new Command("registry")
    .description("Manage MCP server registries")
    .action(async () => {
      console.log("Registry command");
    });

  return registryCommand;
}

export { buildRegistryCommand };
