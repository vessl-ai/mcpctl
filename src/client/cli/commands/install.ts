import arg from "arg";
import chalk from "chalk";
import { logger } from "../../../lib/logger/logger";
import { McpServerType } from "../../core/lib/types/mcp-server";
import { App } from "../app";

const installCommandOptions = {
  "--command": String,
  "--client": String,
  "--env": [String],
  "--name": String,
  "--profile": String,
  "-c": "--command",
  "-a": "--client",
  "-e": "--env",
  "-n": "--name",
  "-p": "--profile",
};
export const installCommand = async (app: App, argv: string[]) => {
  // @ts-ignore
  const options = arg(installCommandOptions, { argv });

  const command = options["--command"];
  const client = options["--client"];
  const env: string[] = options["--env"] || [];
  const name = options["--name"];
  const profile = options["--profile"];

  if (!command) {
    console.error("Error: Command is required. Use -c or --command option.");
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
    console.log(chalk.green("Copy the following json to your mcp.json file:"));
    console.log(JSON.stringify(serverConfig, null, 2));
  }
};
