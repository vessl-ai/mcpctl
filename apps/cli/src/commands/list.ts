import arg from "arg";
import chalk from "chalk";
import fs from "fs";
import os from "os";
import { CLIENT_CONFIG_PATHS } from "../../core/lib/constants/paths";
import { McpClientType } from "../../lib/types/mcp-client-type";
import { App } from "../app";

type ServerListOptions = {
  "--client"?: string;
};

const listCommandOptions = {
  "--client": String,
  "-c": "--client",
};

type ClientServerList = {
  client: string;
  servers: {
    name: string;
    type: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
  }[];
};

const getCursorServers = (): ClientServerList => {
  const cursorConfigFile =
    CLIENT_CONFIG_PATHS.cursor[
      os.platform() as keyof typeof CLIENT_CONFIG_PATHS.cursor
    ];
  if (!fs.existsSync(cursorConfigFile)) {
    return { client: "cursor", servers: [] };
  }

  const cursorConfig = JSON.parse(fs.readFileSync(cursorConfigFile, "utf8"));
  const servers = Object.entries(cursorConfig.mcpServers || {}).map(
    ([name, config]: [string, any]) => ({
      name,
      type: config.type || "unknown",
      command: config.command,
      args: config.args,
      env: config.env,
      url: config.url,
    })
  );

  return { client: "cursor", servers };
};

const getClaudeServers = (): ClientServerList => {
  const claudeConfigFile =
    CLIENT_CONFIG_PATHS.claude[
      os.platform() as keyof typeof CLIENT_CONFIG_PATHS.claude
    ];
  if (!fs.existsSync(claudeConfigFile)) {
    return { client: "claude", servers: [] };
  }

  const claudeConfig = JSON.parse(fs.readFileSync(claudeConfigFile, "utf8"));
  const servers = Object.entries(claudeConfig.mcpServers || {}).map(
    ([name, config]: [string, any]) => ({
      name,
      type: config.type || "unknown",
      command: config.command,
      args: config.args,
      env: config.env,
      url: config.url,
    })
  );

  return { client: "claude", servers };
};

const printServerList = (serverLists: ClientServerList[]): void => {
  if (serverLists.length === 0) {
    console.log(chalk.yellow("No MCP servers found."));
    return;
  }

  serverLists.forEach((clientList) => {
    if (clientList.servers.length === 0) {
      return;
    }

    console.log(chalk.blue(`\n${clientList.client.toUpperCase()} Servers:`));
    console.log("----------------------------------------");

    clientList.servers.forEach((server) => {
      console.log(chalk.green(`\nServer: ${server.name}`));
      if (server.type) {
        console.log(`Type: ${server.type}`);
      }

      if (server.command) {
        const fullCommand = server.args
          ? `${server.command} ${server.args.join(" ")}`
          : server.command;
        console.log(`Command: ${fullCommand}`);
      }

      if (server.url) {
        console.log(`URL: ${server.url}`);
      }

      if (server.env && Object.keys(server.env).length > 0) {
        console.log("Environment Variables:");
        Object.entries(server.env).forEach(([key, value]) => {
          console.log(`  ${key}=${value}`);
        });
      }
    });
  });
};

export const listCommand = async (app: App, argv: string[]) => {
  const options = arg(listCommandOptions, {
    argv,
    permissive: true,
  });

  const client = options["--client"]?.toLowerCase();

  const serverLists: ClientServerList[] = [];

  if (!client || client === McpClientType.CURSOR) {
    serverLists.push(getCursorServers());
  }
  if (!client || client === McpClientType.CLAUDE) {
    serverLists.push(getClaudeServers());
  }

  printServerList(serverLists);
};
