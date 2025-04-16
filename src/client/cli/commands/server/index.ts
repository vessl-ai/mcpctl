import { App } from "../../app";
import { buildServerListCommand } from "./list";
import { buildServerLogsCommand } from "./logs";
import { buildServerStopCommand } from "./stop";

// Commander.js의 Command 객체 대신 함수를 반환하도록 변경
const buildServerCommand = (app: App) => {
  return {
    action: async (options: any) => {
      const subCommand = options.args?.[0];

      if (!subCommand) {
        console.log("Server command");
        console.log("Available subcommands:");
        console.log("  list\t\tList MCP servers");
        console.log("  logs\t\tView MCP server logs");
        console.log("  stop\t\tStop MCP server");
        return;
      }

      switch (subCommand) {
        case "list":
          await buildServerListCommand(app).action(options);
          break;
        case "logs":
          await buildServerLogsCommand(app).action(options);
          break;
        case "stop":
          await buildServerStopCommand(app).action(options);
          break;
        default:
          console.error(`Error: '${subCommand}' is an unknown subcommand.`);
          console.log("Available subcommands:");
          console.log("  list\t\tList MCP servers");
          console.log("  logs\t\tView MCP server logs");
          console.log("  stop\t\tStop MCP server");
          process.exit(1);
      }
    },
  };
};

export { buildServerCommand };
