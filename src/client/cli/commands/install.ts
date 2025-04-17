import arg from "arg";
import chalk from "chalk";
import os from "os";
import {
  McpServerInstallConfig,
  McpServerType,
} from "../../core/lib/types/mcp-server";
import { App } from "../app";

const installCommandOptions = {
  "--command": String,
  "--client": [String],
  "--env": [String],
  "--server-name": String,
  "--profile": String,
  "-c": "--command",
  "-a": "--client",
  "-e": "--env",
  "-n": "--server-name",
  "-p": "--profile",
};
export const installCommand = async (app: App, argv: string[]) => {
  const logger = app.getLogger();

  // @ts-ignore
  const options = arg(installCommandOptions, { argv });

  const command: string = options["--command"] || "";
  const client: string[] = options["--client"] || [];
  const env: string[] = options["--env"] || [];
  const serverName: string = options["--server-name"] || "";
  const profile: string | undefined = options["--profile"];

  console.error(client);

  if (serverName === "") {
    console.error(
      "Error: Server name is required. Use -n or --server-name option."
    );
    process.exit(1);
  }

  if (command === "") {
    console.error("Error: Command is required. Use -c or --command option.");
    process.exit(1);
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

  const serverType = McpServerType.STDIO; // TODO: 추후 변경
  const sanitizedCommand = command.replace(/[^a-zA-Z0-9]/g, "-");
  const logFileKey = `${serverName}-${serverType}-${
    profile ? profile : ""
  }-${sanitizedCommand}`;
  const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();
  const mcpctlEnv = {
    MCPCTL_LOG_FILE: `${homeDir}/.mcpctl/logs/${logFileKey}.log`,
    MCPCTL_LOG_LEVEL: "INFO",
  };

  const serverInstallConfig: McpServerInstallConfig = {
    type: serverType,
    command: command,
    env: envMap,
    serverName: serverName,
    profile: profile,
    mcpctlEnv: mcpctlEnv,
  };
  if (client.length > 0) {
    for (const c of client) {
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
      console.log(JSON.stringify(serverInstallConfig, null, 2));
    }
  } else {
    const serverConfig = await clientService.generateMcpServerConfig(
      serverInstallConfig
    );
    console.log(chalk.green("Copy the following json to your mcp.json file:"));
    console.log(JSON.stringify(serverConfig, null, 2));
  }
};
