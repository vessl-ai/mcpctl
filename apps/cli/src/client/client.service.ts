import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { ClientType } from '../types/client';
import {
  McpJson,
  Server,
  SseServer,
  StdioServer,
} from '../types/mcp.json.schema';

@Injectable()
export class ClientService {
  constructor(private readonly configService: ConfigService) {}

  private async loadClientConfigFile(path: string): Promise<McpJson> {
    const file = fs.readFileSync(path, 'utf8');
    return JSON.parse(file);
  }

  private async saveClientConfigFile(path: string, clientConfig: McpJson) {
    fs.writeFileSync(path, JSON.stringify(clientConfig, null, 2));
  }

  async loadClientConfig(client: ClientType): Promise<McpJson> {
    const path = await this.getClientConfigFilePath(client);
    return this.loadClientConfigFile(path);
  }

  private async getClientConfigFilePath(client: ClientType): Promise<string> {
    switch (client) {
      case ClientType.claude:
        return this.configService.get<string>('app.claudeMcpJsonFilePath')!;
      case ClientType.cursor:
        return this.configService.get<string>('app.cursorMcpJsonFilePath')!;
      default:
        throw new Error(`Unsupported client: ${client}`);
    }
  }

  async saveClientConfig(client: ClientType, clientConfig: McpJson) {
    const path = await this.getClientConfigFilePath(client);
    await this.saveClientConfigFile(path, clientConfig);
  }

  async upsertServerToClientConfig(
    client: ClientType,
    serverName: string,
    server: Server,
  ): Promise<McpJson> {
    const clientConfig = await this.loadClientConfig(client);
    clientConfig.mcpServers[serverName] = server as StdioServer | SseServer;
    await this.saveClientConfig(client, clientConfig);
    return clientConfig;
  }

  async upsertServerToClientConfigFile(
    configPath: string,
    serverName: string,
    server: Server,
  ): Promise<McpJson> {
    const clientConfig = await this.loadClientConfigFile(configPath);
    clientConfig.mcpServers[serverName] = server as StdioServer | SseServer;
    await this.saveClientConfigFile(configPath, clientConfig);
    return clientConfig;
  }
}
