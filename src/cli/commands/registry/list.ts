import arg from 'arg';
import chalk from 'chalk';
import { App } from '../../app';

const listCommandOptions = {};

export const listCommand = async (app: App, argv: string[]) => {
  const options = arg(listCommandOptions, { argv });

  const registryService = app.getRegistryService();
  const registries = registryService.listRegistryDefs();
  if (registries.length === 0) {
    console.log(chalk.yellow('No registries found.'));
    return;
  }

  console.log(chalk.bold('\nRegistered MCP Registries:\n'));
  registries.forEach(registry => {
    console.log(chalk.bold.blue(registry.name));
    console.log(`  Type: ${chalk.cyan(registry.knownType)}`);
    console.log(`  URL:  ${chalk.green(registry.url)}\n`);
  });
};
