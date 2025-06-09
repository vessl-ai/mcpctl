import { ConfigService } from '@nestjs/config';
import { TransportType } from '@vessl-ai/mcpctl-shared/types/common';
import { ServerInstance } from '@vessl-ai/mcpctl-shared/types/domain/server';
import axios from 'axios';
import { spawnSync } from 'child_process';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import openEditor from 'open-editor';
import { ClientService } from '../client/client.service';
import { AppConfig } from '../config/app.config';
import { ClientType } from '../types/client';
import { McpJson, SseServer, StdioServer } from '../types/mcp.json.schema';

const chalk = require('chalk');

@SubCommand({
  name: 'connect',
  description: 'Connect to an MCP server',
  arguments: '<server-name>',
})
export class ConnectCommand extends CommandRunner {
  constructor(
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
  ) {
    super();
  }
  async run(inputs: string[], options?: Record<string, any>): Promise<void> {
    const serverName = inputs[0];
    if (!serverName) {
      console.error(chalk.red.bold('⛔ server-name is required'));
      return;
    }
    const clientName = options?.client;
    const mcpJsonFilePath = options?.mcpJsonFile;
    if (clientName && mcpJsonFilePath) {
      console.error(
        chalk.red.bold(
          '⛔ client-name and mcp-json-file cannot be used together',
        ),
      );
      this.command.help();
    }
    if (!clientName && !mcpJsonFilePath) {
      console.error(
        chalk.red.bold('⛔ client-name or mcp-json-file is required'),
      );
      this.command.help();
    }

    // get server info
    const appConfig = await this.configService.get<AppConfig>('app');
    if (!appConfig) {
      console.error(chalk.red.bold('⛔ app config not found'));
      return;
    }
    const res = await axios.get<ServerInstance>(
      `${appConfig.controlPlaneBaseUrl}/server/${serverName}`,
    );
    const serverInfo = res.data;
    if (!serverInfo) {
      console.error(chalk.red.bold('⛔ server not found'));
      return;
    }
    const serverUrl = serverInfo.connectionUrl;
    const serverTransport = serverInfo.transport;

    if (serverInfo.status !== 'running') {
      console.error(chalk.red.bold('⛔ server is not running'));
      return;
    }

    if (!serverUrl) {
      console.error(chalk.red.bold('⛔ server URL not found'));
      return;
    }

    if (serverTransport.type === TransportType.Sse) {
      const mcpJson = await this.handleAddSSEUrl({
        serverName,
        serverUrl,
        clientName,
        mcpJsonFilePath,
      });
      if (mcpJson) {
        console.log(
          chalk.yellow.bold(
            `"${serverName}": ${JSON.stringify(mcpJson.mcpServers[serverName], null, 2)}`,
          ),
        );
      }
    } else {
      console.error(chalk.red.bold('⛔ server transport type not supported'));
      console.error(
        chalk.red.bold(
          'Please file an issue at https://github.com/vessl-ai/mcpctl/issues',
        ),
      );
      return;
    }
  }

  private async handleAddSSEUrl(param: {
    serverName: string;
    serverUrl: string;
    clientName?: string;
    mcpJsonFilePath?: string;
  }): Promise<McpJson | undefined> {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      console.error(chalk.red.bold('⛔ app config not found'));
      return undefined;
    }
    const { serverName, serverUrl, clientName, mcpJsonFilePath } = param;
    if (clientName) {
      console.log(chalk.green.bold('🔗 Adding SSE URL to client...'));
      const server: StdioServer = {
        type: 'stdio',
        command: 'npx',
        args: ['-y', 'mcp-remote', serverUrl],
      };
      const mcpJson = await this.clientService.upsertServerToClientConfig(
        clientName as ClientType,
        serverName,
        server,
      );

      console.log(chalk.green.bold('🔗 Added SSE URL to client'));
      return mcpJson;
    } else if (mcpJsonFilePath) {
      const server: SseServer = {
        type: 'url',
        url: serverUrl,
      };
      const mcpJson = await this.clientService.upsertServerToClientConfigFile(
        mcpJsonFilePath,
        serverName,
        server,
      );
      console.log(chalk.green.bold('🔗 Added SSE URL to MCP JSON file'));
      return mcpJson;
    } else {
      console.error(
        chalk.red.bold('⛔ client-name or mcp-json-file is required'),
      );
      this.command.help();
      return undefined;
    }
  }

  @Option({
    flags: '-c, --client <client-name>',
    description: 'The name of the client to connect to',
  })
  parseClient(val: string) {
    return val;
  }

  @Option({
    flags: '-f,--mcp-json-file <mcp-json-file>',
    description: 'The MCP JSON file to connect to',
  })
  parseMcpJsonFile(val: string) {
    return val;
  }
}

@SubCommand({
  name: 'open',
  arguments: '<client-name>',
  description: 'Open the MCP JSON file of the client',
})
export class OpenCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  private openFile(filePath: string): void {
    if (process.env.EDITOR) {
      openEditor([{ file: filePath }]);
    } else {
      console.log(
        chalk.yellow.bold('🔗 No editor set with $EDITOR, opening with vim...'),
      );
      spawnSync('vim', [filePath], { stdio: 'inherit' });
    }
  }

  async run(inputs: string[], options?: Record<string, any>): Promise<void> {
    const clientName = inputs[0];
    if (!clientName) {
      console.error(chalk.red.bold('⛔ client-name is required'));
      this.command.help();
    }

    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      console.error(chalk.red.bold('⛔ app config not found'));
      return;
    }

    if (clientName === 'claude') {
      console.log(chalk.green.bold('🔗 Opening Claude MCP JSON file...'));
      const claudeMcpJsonFilePath = appConfig.claudeMcpJsonFilePath;
      this.openFile(claudeMcpJsonFilePath);
    } else if (clientName === 'cursor') {
      console.log(chalk.green.bold('🔗 Opening Cursor MCP JSON file...'));
      const cursorMcpJsonFilePath = appConfig.cursorMcpJsonFilePath;
      this.openFile(cursorMcpJsonFilePath);
    }
  }
}

@Command({
  name: 'client',
  description: 'Manage MCP clients',
  subCommands: [ConnectCommand, OpenCommand],
})
export class ClientCommand extends CommandRunner {
  constructor(private readonly connectCommand: ConnectCommand) {
    super();
  }
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    // do nothing
  }
}
