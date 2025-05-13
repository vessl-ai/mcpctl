import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";
import {
  CLIENT_CONFIG_PATHS,
  CONFIG_PATHS,
} from "../../../core/lib/constants/paths";
import arg = require("arg");

const loadCommandOptions = {
  "--client": String,
  "--name": String,
  "--help": Boolean,
  "-h": "--help",
};

const loadCommand = async (argv: string[]) => {
  const options = arg(loadCommandOptions, {
    argv,
    permissive: true,
  });

  if (options["--help"]) {
    console.log("Usage: mcpctl mcpconfig load --client <client> --name <name>");
    console.log("\nOptions:");
    console.log("  --client <client>  Client name (cursor, claude)");
    console.log("  --name <name>      Name of the configuration to load");
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
    await loadConfig(client, name);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const loadConfig = async (client: string, name: string) => {
  const configFile = path.join(
    CONFIG_PATHS[os.platform() as keyof typeof CONFIG_PATHS],
    "configs",
    client.toLowerCase(),
    `${name}.json`
  );
  if (!fs.existsSync(configFile)) {
    throw new Error(`Configuration '${name}' not found for client '${client}'`);
  }

  const config = JSON.parse(fs.readFileSync(configFile, "utf8"));

  // Ask user what to do with current configuration
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(
      "Current configuration will be overwritten. Do you want to save it first? (y/n): ",
      (answer) => resolve(answer.toLowerCase())
    );
  });

  rl.close();

  if (answer === "y") {
    const saveName = await new Promise<string>((resolve) => {
      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl2.question("Enter a name to save current configuration: ", (name) => {
        rl2.close();
        resolve(name);
      });
    });

    // Save current configuration
    const currentConfig = await getCurrentConfig(client);
    const saveDir = path.join(
      CONFIG_PATHS[os.platform() as keyof typeof CONFIG_PATHS],
      "configs",
      client.toLowerCase()
    );
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(saveDir, `${saveName}.json`),
      JSON.stringify(currentConfig, null, 2)
    );
    console.log(`Current configuration saved as '${saveName}'`);
  }

  // Apply the loaded configuration
  await applyConfig(client, config);
  console.log(`Configuration '${name}' loaded successfully`);
};

const getCurrentConfig = async (client: string): Promise<any> => {
  switch (client.toLowerCase()) {
    case "cursor":
      const cursorConfigFile =
        CLIENT_CONFIG_PATHS.cursor[
          os.platform() as keyof typeof CLIENT_CONFIG_PATHS.cursor
        ];
      if (!fs.existsSync(cursorConfigFile)) {
        throw new Error("Cursor config file not found");
      }
      return JSON.parse(fs.readFileSync(cursorConfigFile, "utf8"));
    case "claude":
      const claudeConfigFile =
        CLIENT_CONFIG_PATHS.claude[
          os.platform() as keyof typeof CLIENT_CONFIG_PATHS.claude
        ];
      if (!fs.existsSync(claudeConfigFile)) {
        throw new Error("Claude config file not found");
      }
      return JSON.parse(fs.readFileSync(claudeConfigFile, "utf8"));
    default:
      throw new Error(`Unsupported client: ${client}`);
  }
};

const applyConfig = async (client: string, config: any): Promise<void> => {
  switch (client.toLowerCase()) {
    case "cursor":
      const cursorConfigFile =
        CLIENT_CONFIG_PATHS.cursor[
          os.platform() as keyof typeof CLIENT_CONFIG_PATHS.cursor
        ];
      fs.writeFileSync(cursorConfigFile, JSON.stringify(config, null, 2));
      break;
    case "claude":
      const claudeConfigFile =
        CLIENT_CONFIG_PATHS.claude[
          os.platform() as keyof typeof CLIENT_CONFIG_PATHS.claude
        ];
      fs.writeFileSync(claudeConfigFile, JSON.stringify(config, null, 2));
      break;
    default:
      throw new Error(`Unsupported client: ${client}`);
  }
};

export default loadCommand;
