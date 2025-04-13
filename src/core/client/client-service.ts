import fs from "fs";
import os from "os";
import path from "path";
import { logger } from "../lib/logger";
import { Client, ClientType, ServerConfig, ServerInstallConfig, ServerType } from "./types";
interface ClientService {
  getClient(client: string): Client;
  generateMcpServerConfig(serverInstallConfig: ServerInstallConfig): ServerConfig;
  installMcpServerToClient(client: Client, serverInstallConfig: ServerInstallConfig): Promise<void>;
}

class ClientServiceImpl implements ClientService {

  getClient(client: string): Client {
    logger.verbose(`Getting client: ${client}`);
    switch (client) {
      case "claude":
        return { type: ClientType.CLAUDE, name: "claude" };
      case "cursor":
        return { type: ClientType.CURSOR, name: "cursor" };
      default:
        throw new Error(`Unsupported client: ${client}`);
    }
  }

  generateMcpServerConfig(serverInstallConfig: ServerInstallConfig): ServerConfig {
    switch (serverInstallConfig.type) {
      case "stdio":
        const serverName = this.getOrGenerateServerName(serverInstallConfig);
        const [command, args] = this.generateCommand(serverInstallConfig);

        return { [serverName]: { 
          type: ServerType.STDIO,
          command,
          args,
          // env: serverInstallConfig.env,
          profile: serverInstallConfig.profile 
        } };
      case "sse":
        throw new Error("SSE is not supported yet");
    }
  }
  async installMcpServerToClient(client: Client, serverInstallConfig: ServerInstallConfig): Promise<void> {
    switch (client.type) {
      case ClientType.CLAUDE:
        await this.installMcpServerToClaude(client, serverInstallConfig);
        return;
      case ClientType.CURSOR:
        await this.installMcpServerToCursor(client, serverInstallConfig);
        return;
    }
  }

  private async installMcpServerToClaude(client: Client, serverInstallConfig: ServerInstallConfig): Promise<void> {
    // locate claude mcp config file
    // for mac: ~/Library/Application Support/Claude/claude_desktop_config.json,
    // for windows: %APPDATA%\Claude\claude_desktop_config.json
    let claudeConfigFilePath = ""
  
    switch (os.platform()) {
      case "darwin":
        claudeConfigFilePath = path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
        break;
      case "win32":
        claudeConfigFilePath = path.join(os.homedir(), "AppData", "Claude", "claude_desktop_config.json");
        break;
      default:
        throw new Error("Unsupported platform");
    }
    if (!fs.existsSync(claudeConfigFilePath)) {
      throw new Error("Claude config file not found");
    }

    // read claude mcp config file
    const claudeConfig = JSON.parse(fs.readFileSync(claudeConfigFilePath, "utf8"));
    if (!claudeConfig.mcpServers) {
      claudeConfig.mcpServers = {};
    }

    const serverConfig = this.generateMcpServerConfig(serverInstallConfig);
    Object.entries(serverConfig).forEach(([serverName, serverConfigBody]) => {
      claudeConfig.mcpServers[serverName] = serverConfigBody;
    });

    fs.writeFileSync(claudeConfigFilePath, JSON.stringify(claudeConfig, null, 2));
  }

  private async installMcpServerToCursor(client: Client, serverInstallConfig: ServerInstallConfig): Promise<void> {
    // locate cursor mcp config file
    const cursorConfigFile = path.join(os.homedir(), ".cursor", "mcp.json");
    if (!fs.existsSync(cursorConfigFile)) {
      throw new Error("Cursor config file not found");
    }

    // read cursor mcp config file
    const cursorMcpConfig = JSON.parse(fs.readFileSync(cursorConfigFile, "utf8"));
    if (!cursorMcpConfig.mcpServers) {
      cursorMcpConfig.mcpServers = {}
    }

    if (serverInstallConfig.profile) {
      // TODO: save envs to profile
    }

    const serverConfig = this.generateMcpServerConfig(serverInstallConfig);
    Object.entries(serverConfig).forEach(([serverName, serverConfigBody]) => {
      cursorMcpConfig.mcpServers[serverName] = serverConfigBody;
    });

    fs.writeFileSync(cursorConfigFile, JSON.stringify(cursorMcpConfig, null, 2));
  }

  private getOrGenerateServerName(serverInstallConfig: ServerInstallConfig): string {
    if (serverInstallConfig.serverName) {
      return serverInstallConfig.serverName;
    }
    // sanitize comand
    const sanitizedCommand = serverInstallConfig.command.replace(/[^a-zA-Z0-9]/g, "-");
    let name = `server-${sanitizedCommand}`;
    if (serverInstallConfig.profile) {
      name = `${name}-${serverInstallConfig.profile}`;
    }
    // TODO: consider version? 

    return name;
  }

  private generateCommand(serverInstallConfig: ServerInstallConfig): [string, string[]] {
    
    const originalCommand = serverInstallConfig.command;
    const command = 'mcpctl';
    const args = ['session', 'connect', '--command', originalCommand];
    if (serverInstallConfig.env) {
      Object.entries(serverInstallConfig.env).forEach(([key, value]) => {
        args.push('--env', `${key}=${value}`);
      });
    }
    if (serverInstallConfig.profile) {
      args.push('--profile', serverInstallConfig.profile);
    }
    return [command, args];
  }
}

const newClientService = (): ClientService => {
  return new ClientServiceImpl();
}

export { ClientService, newClientService };
