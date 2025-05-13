import fs from "fs";
import os from "os";
import path from "path";
import {
  CLIENT_CONFIG_PATHS,
  CONFIG_PATHS,
} from "../../../core/lib/constants/paths";
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
  const cursorConfigFile =
    CLIENT_CONFIG_PATHS.cursor[
      os.platform() as keyof typeof CLIENT_CONFIG_PATHS.cursor
    ];
  if (!fs.existsSync(cursorConfigFile)) {
    throw new Error("Cursor config file not found");
  }

  const cursorMcpConfig = JSON.parse(fs.readFileSync(cursorConfigFile, "utf8"));
  if (!cursorMcpConfig.mcpServers) {
    throw new Error("No mcpServers found in config");
  }

  const configDir = path.join(
    CONFIG_PATHS[os.platform() as keyof typeof CONFIG_PATHS],
    "configs",
    "cursor"
  );
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const targetFile = path.join(configDir, `${name}.json`);
  fs.writeFileSync(targetFile, JSON.stringify(cursorMcpConfig, null, 2));
};

const saveClaudeConfig = async (name: string) => {
  const claudeConfigFile =
    CLIENT_CONFIG_PATHS.claude[
      os.platform() as keyof typeof CLIENT_CONFIG_PATHS.claude
    ];
  if (!fs.existsSync(claudeConfigFile)) {
    throw new Error("Claude config file not found");
  }

  const claudeConfig = JSON.parse(fs.readFileSync(claudeConfigFile, "utf8"));
  if (!claudeConfig.mcpServers) {
    throw new Error("No mcpServers found in config");
  }

  const configDir = path.join(
    CONFIG_PATHS[os.platform() as keyof typeof CONFIG_PATHS],
    "configs",
    "claude"
  );
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const targetFile = path.join(configDir, `${name}.json`);
  fs.writeFileSync(targetFile, JSON.stringify(claudeConfig, null, 2));
};

export default saveCommand;
