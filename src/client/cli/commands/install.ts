import chalk from "chalk";
import { logger } from "../../../lib/logger/logger";
import { McpServerType } from "../../core/lib/types/mcp-server";
import { App } from "../app";

const buildInstallCommand = (app: App) => {
  return {
    action: async (options: any) => {
      const command = options.c || options.command;
      const client = options.a || options.client;
      const env = options.e || options.env;
      const name = options.n || options.name;
      const profile = options.p || options.profile;

      if (!command) {
        console.error(
          "Error: Command is required. Use -c or --command option."
        );
        process.exit(1);
      }

      logger.verbose(
        `Installing MCP server with command: ${command}, client: ${client}, env: ${env}, name: ${name}, profile: ${profile}`
      );
      const clientService = app.getClientService();

      const serverInstallConfig = {
        type: McpServerType.STDIO,
        command: command,
        env: env
          ? env.reduce((acc: Record<string, string>, curr: string) => {
              const [key, value] = curr.split("=");
              acc[key] = value;
              return acc;
            }, {} as Record<string, string>)
          : undefined,
        name: name,
        profile: profile,
      };
      if (client) {
        await clientService.installMcpServerToClient(
          clientService.getClient(client),
          serverInstallConfig
        );
      } else {
        const serverConfig = await clientService.generateMcpServerConfig(
          serverInstallConfig
        );
        console.log(
          chalk.green("Copy the following json to your mcp.json file:")
        );
        console.log(JSON.stringify(serverConfig, null, 2));
      }
    },
  };
};

export { buildInstallCommand };
