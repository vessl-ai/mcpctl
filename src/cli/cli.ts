import { Command } from "commander";
import { newApp } from "./app";
import { buildInstallCommand } from "./commands/install";
import { buildProfileCommand } from "./commands/profile";
import { buildRegistryCommand } from "./commands/registry";
import { buildSearchCommand } from "./commands/search";
import { buildServerCommand } from "./commands/server";
import { buildSessionCommand } from "./commands/session";

const app = newApp();

const program = new Command();

program
  .name("mcpctl")
  .version("1.0.0")
  .description("CLI to control MCP servers")
  .option("-v, --verbose", "Verbose output")
  .addCommand(buildServerCommand(app))
  .addCommand(buildSessionCommand(app))
  .addCommand(buildInstallCommand(app))
  .addCommand(buildProfileCommand(app))
  .addCommand(buildRegistryCommand(app))
  .addCommand(buildSearchCommand(app));

function errorColor(str: string) {
  // Add ANSI escape codes to display text in red.
  return `\x1b[31m${str}\x1b[0m`;
}

program.configureOutput({
  writeOut: (str) => process.stdout.write(`[ERROR] ${str}`),
  outputError: (str, write) => write(errorColor(str)),
});

program.exitOverride( (error) => {
  program.error("Command failed, use -v for more information");
  if (program.opts().verbose) {
    console.error(error);
  }
  process.exit(1);
});

program.parse();

