import fs from "fs";
import os from "os";
import path from "path";
import arg = require("arg");

const listCommandOptions = {
  "--client": String,
  "--help": Boolean,
  "-h": "--help",
};

const listCommand = async (argv: string[]) => {
  const options = arg(listCommandOptions, {
    argv,
    permissive: true,
  });

  if (options["--help"]) {
    console.log("Usage: mcpctl mcpconfig list [options]");
    console.log("\nOptions:");
    console.log("  --client <client>  Client name (cursor, claude)");
    console.log("  --help             Show this help message");
    process.exit(0);
  }

  const client = options["--client"];

  try {
    if (!client) {
      // Show all saved configurations
      await showAllConfigs();
    } else {
      // Show configurations for specific client
      await showClientConfigs(client);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const showAllConfigs = async () => {
  const configDir = path.join(os.homedir(), ".mcpctl", "configs");
  if (!fs.existsSync(configDir)) {
    console.log("No saved configurations found");
    return;
  }

  const clients = fs.readdirSync(configDir);
  if (clients.length === 0) {
    console.log("No saved configurations found");
    return;
  }

  console.log("\nSaved Configurations:");
  console.log("====================");

  for (const client of clients) {
    const clientDir = path.join(configDir, client);
    const configs = fs
      .readdirSync(clientDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));

    if (configs.length > 0) {
      console.log(`\n${client.toUpperCase()}:`);
      configs.forEach((config) => {
        console.log(`  - ${config}`);
      });
    }
  }
};

const showClientConfigs = async (client: string) => {
  const clientDir = path.join(
    os.homedir(),
    ".mcpctl",
    "configs",
    client.toLowerCase()
  );
  if (!fs.existsSync(clientDir)) {
    console.log(`No saved configurations found for client '${client}'`);
    return;
  }

  const configs = fs
    .readdirSync(clientDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(".json", ""));

  if (configs.length === 0) {
    console.log(`No saved configurations found for client '${client}'`);
    return;
  }

  console.log(`\nSaved Configurations for ${client.toUpperCase()}:`);
  console.log("=================================");
  configs.forEach((config) => {
    console.log(`  - ${config}`);
  });
};

export default listCommand;
