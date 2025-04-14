import chalk from "chalk";
import { Command } from "commander";
import { logger } from "../../../lib/logger/logger";
import { McpServerType } from "../../core/lib/types/mcp-server";
import { App } from "../app";
const buildInstallCommand = (app: App): Command => {
  const installCommand = new Command("install")
    .description("Install MCP server")
    .requiredOption("-c, --command <command>", "Usual command to start a mcp server provided by server description")
    .option("-a, --client <client>", "Client app name, e.g. 'claude', 'cursor', if not specified, this will return mcp config json")
    .option("-e, --env <env...>", "Environment variables to be passed to the server")
    .option("-n, --name <name>", "Name of the server, if not specified, it will be generated")
    .option("-p, --profile <profile>", "Profile to use, if not specified, current profile will be used");

  installCommand.action(
    async ({command, client, env, name, profile}:{
      command: string,
      client?: string,
      env?: string[],
      name?: string,
      profile?: string
    }) => {
      logger.verbose(`Installing MCP server with command: ${command}, client: ${client}, env: ${env}, name: ${name}, profile: ${profile}`);
      const clientService = app.getClientService();

      const serverInstallConfig = {
        type: McpServerType.STDIO,
        command: command,
        env: env ? env.reduce((acc, curr) => {
          const [key, value] = curr.split("=");
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>) : undefined,
        name: name,
        profile: profile,
      };
      if (client) {
        await clientService.installMcpServerToClient(clientService.getClient(client), serverInstallConfig);
      } else {
        const serverConfig = await clientService.generateMcpServerConfig(serverInstallConfig);
        console.log(chalk.green("Copy the following json to your mcp.json file:"));
        console.log(JSON.stringify(serverConfig, null, 2));
      }
    }
  );

  return installCommand;
}

export { buildInstallCommand };
