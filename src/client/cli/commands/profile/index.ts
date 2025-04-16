import { App } from "../../app";
import { buildProfileCreateCommand } from "./create";
import { buildProfileDeleteCommand } from "./delete";
import { buildProfileEnvCommand } from "./env";
import { buildProfileListCommand } from "./list";
import { buildProfileShowCommand } from "./show";

const buildProfileCommand = (app: App) => {
  return {
    action: async (options: any) => {
      const subCommand = options.args?.[0];

      if (!subCommand) {
        console.log("Profile command");
        console.log("Available subcommands:");
        console.log("  create\tCreate a new MCP server profile");
        console.log("  list\t\tList MCP server profiles");
        console.log("  env\t\tManage profile environment variables");
        console.log("  show\t\tShow profile details");
        console.log("  delete\tDelete a profile");
        return;
      }

      switch (subCommand) {
        case "create":
          await buildProfileCreateCommand(app).action(options);
          break;
        case "list":
          await buildProfileListCommand(app).action(options);
          break;
        case "env":
          await buildProfileEnvCommand(app).action(options);
          break;
        case "show":
          await buildProfileShowCommand(app).action(options);
          break;
        case "delete":
          await buildProfileDeleteCommand(app).action(options);
          break;
        default:
          console.error(`Error: '${subCommand}' is an unknown subcommand.`);
          console.log("Available subcommands:");
          console.log("  create\tCreate a new MCP server profile");
          console.log("  list\t\tList MCP server profiles");
          console.log("  env\t\tManage profile environment variables");
          console.log("  show\t\tShow profile details");
          console.log("  delete\tDelete a profile");
          process.exit(1);
      }
    },
  };
};

export { buildProfileCommand };
