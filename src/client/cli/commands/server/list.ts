import chalk from "chalk";
import { App } from "../../app";

const buildServerListCommand = (app: App) => {
  return {
    action: async (options: any) => {
      try {
        console.log(chalk.blue.bold("\n🖥  MCP Server List\n"));
        const serverService = app.getServerService();
        const servers = await serverService.listServers();

        if (servers.length === 0) {
          console.log(chalk.yellow("No servers found."));
          return;
        }

        console.table(
          servers.map((server) => ({
            ...server,
            status: server.status
              ? chalk.green("●  Active")
              : chalk.red("○  Inactive"),
          }))
        );
      } catch (error: any) {
        console.error(chalk.red("Error fetching server list:"), error.message);
      }
    },
  };
};

export { buildServerListCommand };
