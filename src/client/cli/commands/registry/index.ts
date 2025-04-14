import { Command } from "commander";
import { App } from "../../app";
import { buildAddCommand } from "./add";
import { buildDeleteCommand } from "./delete";
import { buildListCommand } from "./list";

const buildRegistryCommand = (app: App): Command => {
  const registryCommand = new Command("registry")
    .description("Manage MCP server registries");

  registryCommand
    .addCommand(buildListCommand(app))
    .addCommand(buildAddCommand(app))
    .addCommand(buildDeleteCommand(app));

  return registryCommand;
};

export { buildRegistryCommand };
