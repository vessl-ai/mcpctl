import fs from "fs";
import os from "os";
import { CLIENT_CONFIG_PATHS } from "../../core/lib/constants/paths";
import arg = require("arg");

const deleteCommandOptions = {
  "--client": String,
  "--server": String,
  "--help": Boolean,
  "-h": "--help",
};

const deleteCommand = async (argv: string[]) => {
  const options = arg(deleteCommandOptions, {
    argv,
    permissive: true,
  });

  if (options["--help"]) {
    console.log("Usage: mcpctl delete --client <client> --server <server>");
    console.log("\nOptions:");
    console.log("  --client <client>  Client name (cursor, claude)");
    console.log("  --server <server>  Server name to delete");
    console.log("  --help             Show this help message");
    process.exit(0);
  }

  const client = options["--client"];
  const server = options["--server"];

  if (!client || !server) {
    console.error("Error: --client and --server options are required");
    process.exit(1);
  }

  try {
    switch (client.toLowerCase()) {
      case "cursor":
        await deleteFromCursor(server);
        break;
      case "claude":
        await deleteFromClaude(server);
        break;
      default:
        console.error(`Error: Unsupported client: ${client}`);
        process.exit(1);
    }
    console.log(
      `Successfully deleted server '${server}' from client '${client}'`
    );
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const deleteFromCursor = async (serverName: string) => {
  const cursorConfigFile =
    CLIENT_CONFIG_PATHS.cursor[
      os.platform() as keyof typeof CLIENT_CONFIG_PATHS.cursor
    ];
  if (!fs.existsSync(cursorConfigFile)) {
    throw new Error("Cursor config file not found");
  }

  const cursorConfig = JSON.parse(fs.readFileSync(cursorConfigFile, "utf8"));
  if (!cursorConfig.mcpServers || !cursorConfig.mcpServers[serverName]) {
    throw new Error(`Server '${serverName}' not found in Cursor config`);
  }

  delete cursorConfig.mcpServers[serverName];
  fs.writeFileSync(cursorConfigFile, JSON.stringify(cursorConfig, null, 2));
};

const deleteFromClaude = async (serverName: string) => {
  const claudeConfigFile =
    CLIENT_CONFIG_PATHS.claude[
      os.platform() as keyof typeof CLIENT_CONFIG_PATHS.claude
    ];
  if (!fs.existsSync(claudeConfigFile)) {
    throw new Error("Claude config file not found");
  }

  const claudeConfig = JSON.parse(fs.readFileSync(claudeConfigFile, "utf8"));
  if (!claudeConfig.mcpServers || !claudeConfig.mcpServers[serverName]) {
    throw new Error(`Server '${serverName}' not found in Claude config`);
  }

  delete claudeConfig.mcpServers[serverName];
  fs.writeFileSync(claudeConfigFile, JSON.stringify(claudeConfig, null, 2));
};

export default deleteCommand;
