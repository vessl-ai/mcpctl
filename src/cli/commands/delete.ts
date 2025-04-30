import fs from "fs";
import os from "os";
import path from "path";
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
  const cursorConfigFile = path.join(os.homedir(), ".cursor", "mcp.json");
  if (!fs.existsSync(cursorConfigFile)) {
    throw new Error("Cursor config file not found");
  }

  const cursorMcpConfig = JSON.parse(fs.readFileSync(cursorConfigFile, "utf8"));
  if (!cursorMcpConfig.mcpServers) {
    throw new Error("No mcpServers found in config");
  }

  if (!cursorMcpConfig.mcpServers[serverName]) {
    throw new Error(`Server '${serverName}' not found in config`);
  }

  delete cursorMcpConfig.mcpServers[serverName];
  fs.writeFileSync(cursorConfigFile, JSON.stringify(cursorMcpConfig, null, 2));
};

const deleteFromClaude = async (serverName: string) => {
  let claudeConfigFilePath = "";

  switch (os.platform()) {
    case "darwin":
      claudeConfigFilePath = path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json"
      );
      break;
    case "win32":
      claudeConfigFilePath = path.join(
        os.homedir(),
        "AppData",
        "Claude",
        "claude_desktop_config.json"
      );
      break;
    default:
      throw new Error("Unsupported platform");
  }

  if (!fs.existsSync(claudeConfigFilePath)) {
    throw new Error("Claude config file not found");
  }

  const claudeConfig = JSON.parse(
    fs.readFileSync(claudeConfigFilePath, "utf8")
  );
  if (!claudeConfig.mcpServers) {
    throw new Error("No mcpServers found in config");
  }

  if (!claudeConfig.mcpServers[serverName]) {
    throw new Error(`Server '${serverName}' not found in config`);
  }

  delete claudeConfig.mcpServers[serverName];
  fs.writeFileSync(claudeConfigFilePath, JSON.stringify(claudeConfig, null, 2));
};

export default deleteCommand;
