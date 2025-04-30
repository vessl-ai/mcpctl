import fs from "fs";
import os from "os";
import path from "path";
import arg = require("arg");

const viewCommandOptions = {
  "--client": String,
  "--name": String,
  "--help": Boolean,
  "-h": "--help",
};

const viewCommand = async (argv: string[]) => {
  const options = arg(viewCommandOptions, {
    argv,
    permissive: true,
  });

  if (options["--help"]) {
    console.log("Usage: mcpctl mcpconfig view --client <client> --name <name>");
    console.log("\nOptions:");
    console.log("  --client <client>  Client name (cursor, claude)");
    console.log("  --name <name>      Name of the configuration to view");
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
    await viewConfig(client, name);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const viewConfig = async (client: string, name: string) => {
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

  const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  console.log(`\nConfiguration '${name}' for client '${client}':`);
  console.log("=========================================");
  console.log(JSON.stringify(config, null, 2));
};

export default viewCommand;
