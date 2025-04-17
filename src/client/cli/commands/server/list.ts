import arg from "arg";
import chalk from "chalk";
import Table from "cli-table3";
import {
  McpServerInstance,
  McpServerInstanceStatus,
} from "../../../../lib/types/instance";
import { App } from "../../app";

const serverListCommandOptions = {};

const getStatusColor = (status: McpServerInstanceStatus): string => {
  switch (status) {
    case McpServerInstanceStatus.RUNNING:
      return chalk.green(status);
    case McpServerInstanceStatus.STARTING:
      return chalk.yellow(status);
    case McpServerInstanceStatus.FAILED:
      return chalk.red(status);
    case McpServerInstanceStatus.STOPPED:
      return chalk.gray(status);
    default:
      return status;
  }
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export const serverListCommand = async (app: App, argv: string[]) => {
  const options = arg(serverListCommandOptions, { argv });

  try {
    console.log(chalk.blue.bold("\n🖥  MCP Server List\n"));
    const serverService = app.getServerService();
    const servers = await serverService.listServers();

    if (servers.length === 0) {
      console.log(chalk.yellow("No servers found."));
      return;
    }

    const table = new Table({
      head: [
        "ID",
        "SERVER_NAME",
        "PROFILE",
        "STATUS",
        "MODE",
        "TRANSPORT",
        "SSE_ENDPOINT",
        "PORT",
        "CREATED AT",
      ].map((header) => chalk.bold(header)),
      style: {
        head: [],
        border: [],
      },
    });

    servers.forEach((server: McpServerInstance) => {
      table.push([
        server.id,
        server.config.serverName,
        server.config.profileName,
        getStatusColor(server.status),
        server.config.hosting,
        server.connectionInfo.transport,
        server.connectionInfo.baseUrl,
        server.connectionInfo.port,
        formatDate(server.startedAt),
      ]);
    });

    console.log(table.toString());
  } catch (error: any) {
    console.error(chalk.red("Error fetching server list:"), error.message);
  }
};
