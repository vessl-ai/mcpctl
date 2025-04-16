import { App } from "../../app";
import { buildAddCommand } from "./add";
import { buildDeleteCommand } from "./delete";
import { buildListCommand } from "./list";

const buildRegistryCommand = (app: App) => {
  return {
    action: async (options: any) => {
      const subCommand = options.args?.[0];

      if (!subCommand) {
        console.log("Registry command");
        console.log("Available subcommands:");
        console.log("  list\t\tList MCP server registries");
        console.log("  add\t\tAdd a new MCP server registry");
        console.log("  delete\tDelete a MCP server registry");
        return;
      }

      switch (subCommand) {
        case "list":
          await buildListCommand(app).action(options);
          break;
        case "add":
          await buildAddCommand(app).action(options);
          break;
        case "delete":
          await buildDeleteCommand(app).action(options);
          break;
        default:
          console.error(`Error: '${subCommand}' is an unknown subcommand.`);
          console.log("Available subcommands:");
          console.log("  list\t\tList MCP server registries");
          console.log("  add\t\tAdd a new MCP server registry");
          console.log("  delete\tDelete a MCP server registry");
          process.exit(1);
      }
    },
  };
};

export { buildRegistryCommand };
