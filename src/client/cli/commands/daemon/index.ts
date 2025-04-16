import { App } from "../../app";
import { buildStartCommand } from "./start";
import { buildStatusCommand } from "./status";
import { buildStopCommand } from "./stop";

export const buildDaemonCommand = (app: App) => {
  return {
    action: async (options: any) => {
      // 첫 번째 인자를 서브커맨드로 사용
      const args = process.argv.slice(3); // mcpctl daemon <subcommand> 이후의 인자들
      const subcommand = args[0];

      if (!subcommand) {
        console.log("Available subcommands:");
        console.log("  start   - Start the MCP daemon");
        console.log("  stop    - Stop the MCP daemon");
        console.log("  status  - Check the MCP daemon status");
        process.exit(1);
      }

      switch (subcommand) {
        case "start":
          await buildStartCommand(app).action();
          break;
        case "stop":
          await buildStopCommand(app).action();
          break;
        case "status":
          await buildStatusCommand(app).action();
          break;
        default:
          console.error(
            "Unknown subcommand. Available subcommands: start, stop, status"
          );
          process.exit(1);
      }
    },
  };
};
