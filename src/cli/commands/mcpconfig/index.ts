import arg = require("arg");
import listCommand from "./list";
import loadCommand from "./load";
import removeCommand from "./remove";
import saveCommand from "./save";
import viewCommand from "./view";

const mcpconfigCommandOptions = {
  "--help": Boolean,
  "-h": "--help",
};

export const mcpconfigCommand = async (argv: string[]) => {
  const options = arg(mcpconfigCommandOptions, {
    argv,
    permissive: true,
  });

  if (options["--help"]) {
    console.log("Usage: mcpctl mcpconfig <command> [options]");
    console.log("\nCommands:");
    console.log("  list    List saved configurations");
    console.log("  load    Load a saved configuration");
    console.log("  save    Save current configuration");
    console.log("  remove  Remove a saved configuration");
    console.log("  view    View a saved configuration");
    console.log("\nOptions:");
    console.log("  --help  Show this help message");
    process.exit(0);
  }

  const subcommand = options._[0];
  if (!subcommand) {
    console.log("Available commands:");
    console.log("  list    List saved configurations");
    console.log("  load    Load a saved configuration");
    console.log("  save    Save current configuration");
    console.log("  remove  Remove a saved configuration");
    console.log("  view    View a saved configuration");
    process.exit(0);
  }

  switch (subcommand) {
    case "list":
      await listCommand(options._.slice(1));
      break;
    case "load":
      await loadCommand(options._.slice(1));
      break;
    case "save":
      await saveCommand(options._.slice(1));
      break;
    case "remove":
      await removeCommand(options._.slice(1));
      break;
    case "view":
      await viewCommand(options._.slice(1));
      break;
    default:
      console.error(`Unknown command: ${subcommand}`);
      process.exit(1);
  }
};
