import arg from "arg";
import { App } from "../../app";
import { addCommand } from "./add";
import { deleteCommand } from "./delete";
import { listCommand } from "./list";

const registryCommandOptions = {};

export const registryCommand = async (app: App, argv: string[]) => {
  const options = arg(registryCommandOptions, { argv, stopAtPositional: true });

  const subArgv = options["_"];

  if (!subArgv || subArgv.length === 0) {
    console.error("Error: No command specified.");
    console.error("Available commands: list, add, delete");
    process.exit(1);
  }
  const subCommand = subArgv[0];

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
      await listCommand(app, subArgv.slice(1));
      break;
    case "add":
      await addCommand(app, subArgv.slice(1));
      break;
    case "delete":
      await deleteCommand(app, subArgv.slice(1));
      break;
    default:
      console.error(`Error: '${subCommand}' is an unknown subcommand.`);
      console.log("Available subcommands:");
      console.log("  list\t\tList MCP server registries");
      console.log("  add\t\tAdd a new MCP server registry");
      console.log("  delete\tDelete a MCP server registry");
      process.exit(1);
  }
};
