import arg from "arg";
import { App } from "../../app";
import { profileCreateCommand } from "./create";
import { profileDeleteCommand } from "./delete";
import { profileSetEnvCommand } from "./env";
import { profileListCommand } from "./list";
import { profileShowCommand } from "./show";

const profileCommandOptions = {};

export const profileCommand = async (app: App, argv: string[]) => {
  const options = arg(profileCommandOptions, { argv, stopAtPositional: true });

  const subArgv = options["_"];
  const subCommand = subArgv?.[0];

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
      await profileCreateCommand(app, subArgv.slice(1));
      break;
    case "list":
      await profileListCommand(app, subArgv.slice(1));
      break;
    case "env":
      await profileSetEnvCommand(app, subArgv.slice(1));
      break;
    case "show":
      await profileShowCommand(app, subArgv.slice(1));
      break;
    case "delete":
      await profileDeleteCommand(app, subArgv.slice(1));
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
};
