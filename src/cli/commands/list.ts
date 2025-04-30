import arg from "arg";
import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
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
  const cursorConfigFile = path.join(os.homedir(), ".cursor", "mcp.json");
  if (!fs.existsSync(cursorConfigFile)) {
    return { client: "cursor", servers: [] };
  }

  const cursorMcpConfig = JSON.parse(fs.readFileSync(cursorConfigFile, "utf8"));
  const servers = Object.entries(cursorMcpConfig.mcpServers || {}).map(
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
      return { client: "claude", servers: [] };
  }

  if (!fs.existsSync(claudeConfigFilePath)) {
    return { client: "claude", servers: [] };
  }

  const claudeConfig = JSON.parse(
    fs.readFileSync(claudeConfigFilePath, "utf8")
  );
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
