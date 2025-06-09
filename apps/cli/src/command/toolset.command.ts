import { confirm, input } from '@inquirer/prompts';
import * as chalk from 'chalk';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import { ClientService } from '../client/client.service';
import { ToolsetService } from '../client/toolset.service';
import { ClientType } from '../types/client';

@SubCommand({
  name: 'save',
  description: 'Save a toolset',
  arguments: '<name>',
})
export class ToolsetSaveCommand extends CommandRunner {
  constructor(private readonly toolsetService: ToolsetService) {
    super();
  }

  async run(
    passedParams: string[],
    options: { client: string; description: string },
  ): Promise<void> {
    const toolsetName = passedParams[0];
    await this.toolsetService.saveToolsetToFile(
      toolsetName,
      options.client as ClientType,
      options.description,
    );
    console.log('Toolset saved');
  }

  @Option({
    flags: '-c, --client <client>',
    description: 'The client to save the toolset for',
  })
  parseClient(val: string) {
    return val;
  }

  @Option({
    flags: '-d, --description <description>',
    description: 'The description of the toolset',
  })
  parseDescription(val: string) {
    return val;
  }
}

@SubCommand({
  name: 'list',
  description: 'List all toolsets',
})
export class ToolsetListCommand extends CommandRunner {
  constructor(private readonly toolsetService: ToolsetService) {
    super();
  }

  async run(params: string[], options: { client: string }): Promise<void> {
    const toolsets = await this.toolsetService.listToolsets(
      options.client as ClientType,
    );
    Object.entries(toolsets).forEach(([client, sets]) => {
      console.log(`\n${chalk.blue.bold('[Client: ' + client + ']')}`);
      if (!sets || sets.length === 0) {
        console.log(chalk.gray('  (No toolsets found)'));
        return;
      }
      sets.forEach((toolset, idx) => {
        console.log(`  ${chalk.yellow.bold(idx + 1 + '. ' + toolset.name)}`);
        if (toolset.description) {
          console.log(
            `     ${chalk.italic.gray('desc: ' + toolset.description)}`,
          );
        }
        // Print mcpServers summary
        if (toolset.mcpServers && Object.keys(toolset.mcpServers).length > 0) {
          console.log(chalk.gray('     servers:'));
          Object.entries(toolset.mcpServers).forEach(([srvName, srv]) => {
            let line = '';
            if (srv && typeof srv === 'object') {
              if ('command' in srv) {
                line = `       - ${chalk.bold(srvName)}: ${chalk.green('[stdio]')} ${srv.command} ${(srv.args || []).join(' ')}`;
              } else if ('url' in srv) {
                line = `       - ${chalk.bold(srvName)}: ${chalk.cyan('[url]')} ${srv.url}`;
              } else {
                line = `       - ${chalk.bold(srvName)}: ${chalk.red('[unknown type]')}`;
              }
            } else {
              line = `       - ${chalk.bold(srvName)}: ${chalk.red('[unknown type]')}`;
            }
            console.log(line);
          });
        } else {
          console.log(chalk.gray('     servers: (none)'));
        }
      });
    });
  }

  @Option({
    flags: '-c, --client <client>',
    description: 'The client to list the toolsets for',
  })
  parseClient(val: string) {
    return val;
  }
}

@SubCommand({
  name: 'load',
  description: 'Load a toolset',
  arguments: '<name>',
})
export class ToolsetLoadCommand extends CommandRunner {
  constructor(
    private readonly toolsetService: ToolsetService,
    private readonly clientService: ClientService,
  ) {
    super();
  }

  async run(params: string[], options: { client: string }): Promise<void> {
    // ask user to save current config
    const currentConfig = await this.clientService.loadClientConfig(
      options.client as ClientType,
    );
    const saveCurrentConfig = await confirm({
      message: 'Do you want to save the current config?',
      default: true,
    });
    if (saveCurrentConfig) {
      const toolsetName = await input({
        message: 'Enter the name of the toolset',
        validate: (val) => {
          if (val.length === 0) {
            return 'Toolset name is required';
          }
          return true;
        },
      });
      const description = await input({
        message: 'Enter the description of the toolset',
      });
      await this.toolsetService.saveToolsetToFile(
        toolsetName,
        options.client as ClientType,
        description,
      );
    }
    const toolset = await this.toolsetService.loadToolsetToClientConfig(
      options.client as ClientType,
      params[0],
    );
    // Print loaded toolset config in a pretty format (with robust type checking and colors)
    console.log(`\n${chalk.magenta.bold('[Loaded Toolset Config]')}`);
    if (toolset.mcpServers && Object.keys(toolset.mcpServers).length > 0) {
      Object.entries(toolset.mcpServers).forEach(([srvName, srv]) => {
        let line = '';
        if (srv && typeof srv === 'object') {
          if ('command' in srv) {
            line = `  - ${chalk.bold(srvName)}: ${chalk.green('[stdio]')} ${srv.command} ${(srv.args || []).join(' ')}`;
          } else if ('url' in srv) {
            line = `  - ${chalk.bold(srvName)}: ${chalk.cyan('[url]')} ${srv.url}`;
          } else {
            line = `  - ${chalk.bold(srvName)}: ${chalk.red('[unknown type]')}`;
          }
        } else {
          line = `  - ${chalk.bold(srvName)}: ${chalk.red('[unknown type]')}`;
        }
        console.log(line);
      });
    } else {
      console.log(chalk.gray('  (No servers in config)'));
    }
  }

  @Option({
    flags: '-c, --client <client>',
    description: 'The client to load the toolset for',
  })
  parseClient(val: string) {
    return val;
  }
}

@Command({
  name: 'toolset',
  description: 'Toolset commands',
  aliases: ['ts'],
  subCommands: [ToolsetSaveCommand, ToolsetListCommand, ToolsetLoadCommand],
})
export class ToolsetCommand extends CommandRunner {
  async run(passedParams: string[]): Promise<void> {
    console.log('Toolset commands');
  }
}
