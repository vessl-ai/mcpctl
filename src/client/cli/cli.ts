import { Command } from "commander";
import { newApp } from "./app";
import { buildDaemonCommand } from "./commands/daemon";
import { buildInstallCommand } from "./commands/install";
import { buildProfileCommand } from "./commands/profile";
import { buildRegistryCommand } from "./commands/registry";
import { buildSearchCommand } from "./commands/search";
import { buildServerCommand } from "./commands/server";
import { buildSessionCommand } from "./commands/session";
const main = async () => {
  const app = newApp();
  await app.init();
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
  .addCommand(buildSearchCommand(app))
  .addCommand(buildDaemonCommand(app));

function errorColor(str: string) {
  // Add ANSI escape codes to display text in red.
  return `\x1b[31m${str}\x1b[0m`;
}

program.configureOutput({
  writeOut: (str) => process.stdout.write(`[ERROR] ${str}`),
  outputError: (str, write) => write(errorColor(str)),
});

program.exitOverride((error) => {
  if (error.code === 'commander.unknownCommand') {
    console.error(`\nError: '${error.message.split("'")[1]}' is an unknown command.`);
    console.error('\nAvailable commands:');
    program.commands.forEach(cmd => {
      console.error(`  ${cmd.name()}\t\t${cmd.description()}`);
    });
    console.error('\nFor detailed help: mcpctl --help');
  } 
  // @ts-ignore
  else if (error.code === "ENOENT") {
    console.error('Daemon is not running, trying to start it by running `mcp daemon start`');
  } else {
    console.error('\nAn error occurred. Use -v option for more details.');
    if (program.opts().verbose) {
      console.error(error);
    }
  }
  process.exit(1);
});

  program.parse();
}

main();
