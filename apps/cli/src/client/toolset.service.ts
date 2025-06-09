import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { ClientType } from '../types/client';
import { McpJson } from '../types/mcp.json.schema';
import { Toolset } from '../types/toolset';
import { ClientService } from './client.service';

@Injectable()
export class ToolsetService {
  constructor(
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
  ) {}

  private async loadToolsetFile(
    toolsetName: string,
    client?: ClientType,
  ): Promise<Toolset> {
    const toolsetDirPath = this.configService.get<string>('app.toolsetDirPath');
    if (!toolsetDirPath) {
      throw new Error('Toolset directory path not found');
    }
    const clientPrefix = client ?? 'default';
    const clientToolsetDirPath = path.join(toolsetDirPath, clientPrefix);
    if (!fs.existsSync(clientToolsetDirPath)) {
      throw new Error('Toolset directory path is not a directory');
    }
    const toolsetFilePath = path.join(
      clientToolsetDirPath,
      `${toolsetName}.json`,
    );
    const toolsetFile = fs.readFileSync(toolsetFilePath, 'utf8');
    return JSON.parse(toolsetFile);
  }

  async loadToolsetToClientConfig(
    client: ClientType,
    toolsetName: string,
  ): Promise<McpJson> {
    const toolset = await this.loadToolsetFile(toolsetName, client);
    const clientConfig = await this.clientService.loadClientConfig(client);
    for (const serverName in toolset.mcpServers) {
      clientConfig.mcpServers[serverName] = toolset.mcpServers[serverName];
    }
    await this.clientService.saveClientConfig(client, clientConfig);
    return clientConfig;
  }

  async saveToolsetToFile(
    toolsetName: string,
    client: ClientType,
    description?: string,
  ) {
    const mcpJson = await this.clientService.loadClientConfig(client);
    const toolset: Toolset = {
      name: toolsetName,
      description: description,
      mcpServers: mcpJson.mcpServers,
    };
    const toolsetDirPath = this.configService.get<string>('app.toolsetDirPath');
    if (!toolsetDirPath) {
      throw new Error('Toolset directory path not found');
    }
    const clientPrefix = client ?? 'default';
    const clientToolsetDirPath = path.join(toolsetDirPath, clientPrefix);
    if (!fs.existsSync(clientToolsetDirPath)) {
      fs.mkdirSync(clientToolsetDirPath, { recursive: true });
    }

    const toolsetFilePath = path.join(
      clientToolsetDirPath,
      `${toolsetName}.json`,
    );
    fs.writeFileSync(toolsetFilePath, JSON.stringify(toolset, null, 2));
  }

  async listToolsets(
    client?: ClientType,
  ): Promise<{ [client: string]: Toolset[] }> {
    const toolsetDirPath = this.configService.get<string>('app.toolsetDirPath');
    if (!toolsetDirPath) {
      throw new Error('Toolset directory path not found');
    }
    const toolsets: { [client: string]: Toolset[] } = {};
    const clientsList = fs.readdirSync(toolsetDirPath);
    for (const clientEntry of clientsList) {
      toolsets[clientEntry] = [];
      const clientToolsetDirPath = path.join(toolsetDirPath, clientEntry);
      const toolsetFiles = fs.readdirSync(clientToolsetDirPath);
      for (const toolsetFile of toolsetFiles) {
        const toolset = await this.loadToolsetFile(
          toolsetFile.replace('.json', ''),
          clientEntry as ClientType,
        );
        toolsets[clientEntry].push(toolset);
      }
    }
    if (client) {
      return { [client]: toolsets[client] };
    }
    return toolsets;
  }
}
