import { Command } from "commander";
import { App } from "../app";

const buildInstallCommand = (app: App): Command => {
  const installCommand = new Command("install")
    .description("Install MCP server")
    .action(async () => {
      console.log("Install command");
    });

  return installCommand;
}

export { buildInstallCommand };
