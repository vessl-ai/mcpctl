import fs from "fs";
import os from "os";
import path from "path";
import arg = require("arg");

const removeCommandOptions = {
  "--client": String,
  "--name": String,
  "--help": Boolean,
  "-h": "--help",
};

const removeCommand = async (argv: string[]) => {
  const options = arg(removeCommandOptions, {
    argv,
    permissive: true,
  });

  if (options["--help"]) {
    console.log(
      "Usage: mcpctl mcpconfig remove --client <client> --name <name>"
    );
    console.log("\nOptions:");
    console.log("  --client <client>  Client name (cursor, claude)");
    console.log("  --name <name>      Name of the configuration to remove");
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
    await removeConfig(client, name);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const removeConfig = async (client: string, name: string) => {
  const configFile = path.join(
    os.homedir(),
    ".mcpctl",
    "configs",
    client.toLowerCase(),
    `${name}.json`
  );
  if (!fs.existsSync(configFile)) {
    throw new Error(`Configuration '${name}' not found for client '${client}'`);
  }

  fs.unlinkSync(configFile);
  console.log(`Configuration '${name}' removed successfully`);

  // Check if the client directory is empty and remove it if so
  const clientDir = path.join(
    os.homedir(),
    ".mcpctl",
    "configs",
    client.toLowerCase()
  );
  const remainingFiles = fs.readdirSync(clientDir);
  if (remainingFiles.length === 0) {
    fs.rmdirSync(clientDir);
  }
};

export default removeCommand;
