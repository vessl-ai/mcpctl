import fs from "fs";
import os from "os";
import path from "path";
import { Logger } from "../../../../lib/logger/logger";
import { McpClient, McpClientType } from "../../lib/types/mcp-client";
import {
  McpServerConfig,
  McpServerInstallConfig,
  McpServerType,
} from "../../lib/types/mcp-server";
export interface McpClientService {
  getClient(client: string): McpClient;
  generateMcpServerConfig(
    serverInstallConfig: McpServerInstallConfig
  ): McpServerConfig;
  installMcpServerToClient(
    client: McpClient,
    serverInstallConfig: McpServerInstallConfig
  ): Promise<McpServerConfig>;
}

export class McpClientServiceImpl implements McpClientService {
  private logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }
  getClient(client: string): McpClient {
    this.logger.verbose(`Getting client: ${client}`);
    switch (client) {
      case "claude":
        return { type: McpClientType.CLAUDE, name: "claude" };
      case "cursor":
        return { type: McpClientType.CURSOR, name: "cursor" };
      default:
        throw new Error(`Unsupported client: ${client}`);
    }
  }

  generateMcpServerConfig(
    serverInstallConfig: McpServerInstallConfig,
    options: { useBase64Command: boolean } = { useBase64Command: false }
  ): McpServerConfig {
    switch (serverInstallConfig.type) {
      case "stdio":
        const serverName = this.getOrGenerateServerName(serverInstallConfig);
        const [command, args] = this.generateCommand(
          serverInstallConfig,
          options
        );

        return {
          [serverName]: {
            type: McpServerType.STDIO,
            command,
            args,
            // env: serverInstallConfig.env,
            profile: serverInstallConfig.profile,
            env: serverInstallConfig.mcpctlEnv,
          },
        };
      case "sse":
        throw new Error("SSE is not supported yet");
    }
  }
  async installMcpServerToClient(
    client: McpClient,
    serverInstallConfig: McpServerInstallConfig
  ): Promise<McpServerConfig> {
    switch (client.type) {
      case McpClientType.CLAUDE:
        return await this.installMcpServerToClaude(client, serverInstallConfig);
      case McpClientType.CURSOR:
        return await this.installMcpServerToCursor(client, serverInstallConfig);
    }
  }

  private async installMcpServerToClaude(
    client: McpClient,
    serverInstallConfig: McpServerInstallConfig
  ): Promise<McpServerConfig> {
    // locate claude mcp config file
    // for mac: ~/Library/Application Support/Claude/claude_desktop_config.json,
    // for windows: %APPDATA%\Claude\claude_desktop_config.json
    let claudeConfigFilePath = "";

    switch (os.platform()) {
      case "darwin":
        claudeConfigFilePath = path.join(
          os.homedir(),
          "Library",
          "Application Support",
          "Claude",
          "claude_desktop_config.json"
        );
        break;
      case "win32":
        claudeConfigFilePath = path.join(
          os.homedir(),
          "AppData",
          "Claude",
          "claude_desktop_config.json"
        );
        break;
      default:
        throw new Error("Unsupported platform");
    }
    if (!fs.existsSync(claudeConfigFilePath)) {
      throw new Error("Claude config file not found");
    }

    // read claude mcp config file
    const claudeConfig = JSON.parse(
      fs.readFileSync(claudeConfigFilePath, "utf8")
    );
    if (!claudeConfig.mcpServers) {
      claudeConfig.mcpServers = {};
    }

    const serverConfig = this.generateMcpServerConfig(serverInstallConfig);
    Object.entries(serverConfig).forEach(([serverName, serverConfigBody]) => {
      claudeConfig.mcpServers[serverName] = serverConfigBody;
    });

    fs.writeFileSync(
      claudeConfigFilePath,
      JSON.stringify(claudeConfig, null, 2)
    );
    return serverConfig;
  }

  private async installMcpServerToCursor(
    client: McpClient,
    serverInstallConfig: McpServerInstallConfig
  ): Promise<McpServerConfig> {
    // locate cursor mcp config file
    const cursorConfigFile = path.join(os.homedir(), ".cursor", "mcp.json");
    if (!fs.existsSync(cursorConfigFile)) {
      throw new Error("Cursor config file not found");
    }

    // read cursor mcp config file
    const cursorMcpConfig = JSON.parse(
      fs.readFileSync(cursorConfigFile, "utf8")
    );
    if (!cursorMcpConfig.mcpServers) {
      cursorMcpConfig.mcpServers = {};
    }

    if (serverInstallConfig.profile) {
      // TODO: save envs to profile
    }

    // Black magic for cursor - command should be base64 encoded
    const serverConfig = this.generateMcpServerConfig(serverInstallConfig, {
      useBase64Command: true,
    });

    Object.entries(serverConfig).forEach(([serverName, serverConfigBody]) => {
      cursorMcpConfig.mcpServers[serverName] = serverConfigBody;
    });

    fs.writeFileSync(
      cursorConfigFile,
      JSON.stringify(cursorMcpConfig, null, 2)
    );

    return serverConfig;
  }

  private getOrGenerateServerName(
    serverInstallConfig: McpServerInstallConfig
  ): string {
    if (serverInstallConfig.serverName) {
      return serverInstallConfig.serverName;
    }
    // sanitize comand
    const sanitizedCommand = serverInstallConfig.command.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    );
    let name = `mcpctl-server-${sanitizedCommand}`;
    if (serverInstallConfig.profile) {
      name = `${name}-${serverInstallConfig.profile}`;
    }
    // TODO: consider version?

    return name;
  }

  private generateCommand(
    serverInstallConfig: McpServerInstallConfig,
    options: { useBase64Command: boolean } = { useBase64Command: false }
  ): [string, string[]] {
    const originalCommand = serverInstallConfig.command;
    const command = "mcpctl";
    const args = [
      "session",
      "connect",
      "--server",
      serverInstallConfig.serverName,
    ];
    if (options.useBase64Command) {
      args.push(
        "--command-base64",
        Buffer.from(originalCommand).toString("base64")
      );
    } else {
      args.push("--command", originalCommand);
    }
    if (serverInstallConfig.env) {
      Object.entries(serverInstallConfig.env).forEach(([key, value]) => {
        args.push("--env", `${key}=${value}`);
      });
    }
    if (serverInstallConfig.profile) {
      args.push("--profile", serverInstallConfig.profile);
    }
    return [command, args];
  }
}

export const newMcpClientService = (logger: Logger): McpClientService => {
  return new McpClientServiceImpl(logger);
};
