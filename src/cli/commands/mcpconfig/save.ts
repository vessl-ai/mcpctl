import fs from "fs";
import os from "os";
import path from "path";
import arg = require("arg");

const saveCommandOptions = {
  "--client": String,
  "--name": String,
  "--help": Boolean,
  "-h": "--help",
};

const saveCommand = async (argv: string[]) => {
  const options = arg(saveCommandOptions, {
    argv,
    permissive: true,
  });

  if (options["--help"]) {
    console.log("Usage: mcpctl save --client <client> --name <name>");
    console.log("\nOptions:");
    console.log("  --client <client>  Client name (cursor, claude)");
    console.log("  --name <name>      Name for the saved configuration");
    console.log("  --help             Show this help message");
    process.exit(0);
  }

  const client = options["--client"];
  const name = options["--name"];

  if (!client || !name) {
    console.error("Error: --client and --name options are required");
    process.exit(1);
  }

  try {
    switch (client.toLowerCase()) {
      case "cursor":
        await saveCursorConfig(name);
        break;
      case "claude":
        await saveClaudeConfig(name);
        break;
      default:
        console.error(`Error: Unsupported client: ${client}`);
        process.exit(1);
    }
    console.log(`Successfully saved ${client} configuration as '${name}'`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const saveCursorConfig = async (name: string) => {
  const cursorConfigFile = path.join(os.homedir(), ".cursor", "mcp.json");
  if (!fs.existsSync(cursorConfigFile)) {
    throw new Error("Cursor config file not found");
  }

  const cursorMcpConfig = JSON.parse(fs.readFileSync(cursorConfigFile, "utf8"));
  if (!cursorMcpConfig.mcpServers) {
    throw new Error("No mcpServers found in config");
  }

  const configDir = path.join(os.homedir(), ".mcpctl", "configs", "cursor");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const targetFile = path.join(configDir, `${name}.json`);
  fs.writeFileSync(targetFile, JSON.stringify(cursorMcpConfig, null, 2));
};

const saveClaudeConfig = async (name: string) => {
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

  const configDir = path.join(os.homedir(), ".mcpctl", "configs", "claude");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const targetFile = path.join(configDir, `${name}.json`);
  fs.writeFileSync(targetFile, JSON.stringify(claudeConfig, null, 2));
};

export default saveCommand;
