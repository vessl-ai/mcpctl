import { App } from "../../app";
import { buildSessionConnectCommand } from "./connect";
import { buildSessionListCommand } from "./list";
import { buildSessionStopCommand } from "./stop";

// Commander.js의 Command 객체 대신 함수를 반환하도록 변경
const buildSessionCommand = (app: App) => {
  return {
    action: async (options: any) => {
      const subCommand = options.args?.[0];

      if (!subCommand) {
        console.log("Session command");
        console.log("Available subcommands:");
        console.log("  list\t\tList MCP server sessions");
        console.log("  stop\t\tStop MCP server sessions");
        console.log("  connect\tConnect to MCP server");
        return;
      }

      switch (subCommand) {
        case "list":
          await buildSessionListCommand(app).action(options);
          break;
        case "stop":
          await buildSessionStopCommand(app).action(options);
          break;
        case "connect":
          await buildSessionConnectCommand(app).action(options);
          break;
        default:
          console.error(`Error: '${subCommand}' is an unknown subcommand.`);
          console.log("Available subcommands:");
          console.log("  list\t\tList MCP server sessions");
          console.log("  stop\t\tStop MCP server sessions");
          console.log("  connect\tConnect to MCP server");
          process.exit(1);
      }
    },
  };
};

export { buildSessionCommand };
