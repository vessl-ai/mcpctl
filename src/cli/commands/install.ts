import arg from "arg";
import chalk from "chalk";
import os from "os";
import {
  McpServerInstallConfig,
  McpServerType,
} from "../../core/lib/types/mcp-server";
import { ValidationError } from "../../lib/errors";
import { App } from "../app";

const installCommandOptions = {
  "--command": String,
  "--client": [String],
  "--env": [String],
  "--secret": [String],
  "--server-name": String,
  "--profile": String,
  "--log-level": String,
  "-c": "--command",
  "-a": "--client",
  "-e": "--env",
  "-n": "--server-name",
  "-p": "--profile",
  "-l": "--log-level",
  "-s": "--secret",
};
export const installCommand = async (app: App, argv: string[]) => {
  const logger = app.getLogger();

  // @ts-ignore
  const options = arg(installCommandOptions, { argv });

  const command: string = options["--command"] || "";
  const client: string[] = options["--client"] || [];
  const env: string[] = options["--env"] || [];
  const secret: string[] = options["--secret"] || [];
  const serverName: string = options["--server-name"] || "";
  const profile: string | undefined = options["--profile"];
  const logLevel: string = options["--log-level"] || "INFO";

  if (serverName === "") {
    logger.error(
      "Error: Server name is required. Use -n or --server-name option."
    );
    throw new ValidationError("Error: Server name is required.");
  }

  if (command === "") {
    logger.error("Error: Command is required. Use -c or --command option.");
    throw new ValidationError("Error: Command is required.");
  }

  logger.verbose(
    `Installing MCP server with command: ${command}, client: ${client}, env: ${env}, serverName: ${serverName}, profile: ${profile}`
  );
  const clientService = app.getClientService();

  const envMap = env.reduce((acc: Record<string, string>, curr: string) => {
    const [key, value] = curr.split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const secretMap = secret.reduce(
    (acc: Record<string, string>, curr: string) => {
      const [key, value] = curr.split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const serverType = McpServerType.STDIO; // TODO: 추후 변경
  const logFileKey = `session.${client}.${serverName}`;
  const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();
  const mcpctlEnv = {
    MCPCTL_LOG_FILE: `${homeDir}/.mcpctl/logs/${logFileKey}.log`,
    MCPCTL_LOG_LEVEL: logLevel,
  };

  const serverInstallConfig: McpServerInstallConfig = {
    type: serverType,
    command: command,
    env: envMap,
    secrets: secretMap,
    serverName: serverName,
    profile: profile,
    mcpctlEnv: mcpctlEnv,
  };
  if (client.length > 0) {
    for (const c of client) {
      const installedServerConfig =
        await clientService.installMcpServerToClient(
          clientService.getClient(c),
          serverInstallConfig
        );
      console.log(chalk.green(`MCP server installed successfully to ${c}.`));
      if (c === "claude") {
        console.log(
          chalk.green(
            "Please restart Claude Desktop to use the new MCP server."
          )
        );
      }
      console.log(chalk.green("MCP server config:"));
      console.log(JSON.stringify(installedServerConfig, null, 2));
    }
  } else {
    const serverConfig = await clientService.generateMcpServerConfig(
      serverInstallConfig
    );
    console.log(chalk.green("Copy the following json to your mcp.json file:"));
    console.log(JSON.stringify(serverConfig, null, 2));
  }
};
