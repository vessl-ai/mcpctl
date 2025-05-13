import arg from "arg";
import { GLOBAL_CONSTANTS } from "../../../lib/constants";
import {
  CliError,
  ResourceNotFoundError,
  ValidationError,
} from "../../../lib/errors";
import { maskSecret } from "../../../lib/logger/logger";
import { App } from "../../app";

export const secretCommand = async (app: App, argv: string[]) => {
  const options = arg({}, { argv, permissive: true });
  const subcommand = options["_"]?.[0];

  const logger = app.getLogger();

  switch (subcommand) {
    case "set":
      await secretSetCommand(app, argv);
      break;
    case "get":
      await secretGetCommand(app, argv);
      break;
    case "remove":
      await secretRemoveCommand(app, argv);
      break;
    case "list":
      await secretListCommand(app, argv);
      break;
    default:
      logger.error(
        `Unknown subcommand ${subcommand}. Available subcommands: set, get, remove, list`
      );
      throw new CliError(
        `Unknown subcommand ${subcommand}. Available subcommands: set, get, remove, list`
      );
  }
};

export const secretListCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--tags": [String],
      "-t": "--tags",
    },
    { argv }
  );

  const logger = app.getLogger();
  const tags = options["--tags"];

  console.log("\n🔐 Secrets");
  console.log("=========");

  const secrets = app.getSecretService().listSecrets(tags);
  if (Object.keys(secrets).length === 0) {
    console.log("  No secrets set");
  } else {
    for (const [key, secret] of Object.entries(secrets)) {
      console.log(`  - ${key}: ${secret.description || "No description"}`);
      if (secret.tags && secret.tags.length > 0) {
        console.log(`    Tags: ${secret.tags.join(", ")}`);
      }
    }
  }
};

export const secretSetCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--entry": [String],
      "--description": String,
      "--tags": [String],
      "-e": "--entry",
      "-d": "--description",
      "-t": "--tags",
    },
    { argv }
  );

  const logger = app.getLogger();
  const entry = options["--entry"];
  const description = options["--description"];
  const tags = options["--tags"];

  if (!entry) {
    throw new ValidationError("Secret key value is required");
  }

  const secrets = Object.fromEntries(entry.map((e) => e.split("=")));

  try {
    await app.getSecretService().setSecrets(secrets, description, tags);
    console.log("✅ Secret updated successfully!");

    console.log("\nUpdated secret:");
    for (const [key, value] of Object.entries(secrets)) {
      console.log(
        maskSecret(
          `  - ${key}: ${GLOBAL_CONSTANTS.SECRET_TAG_START}${value}${GLOBAL_CONSTANTS.SECRET_TAG_END}`
        )
      );
    }
  } catch (error) {
    logger.error("❌ Failed to update secret:", { error });
    throw new CliError("Failed to update secret", error);
  }
};

export const secretGetCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--key": String,
      "-k": "--key",
    },
    { argv }
  );

  const logger = app.getLogger();
  const key = options["--key"];

  if (!key) {
    throw new ValidationError("Secret key is required");
  }

  try {
    const value = await app.getSecretService().getSecret(key);
    if (value === null) {
      logger.error(`Secret '${key}' not found`);
      throw new ResourceNotFoundError(`Secret '${key}' not found`);
    }

    console.log("\n🔐 Secret:");
    console.log("=========");
    console.log(
      maskSecret(
        `${key}: ${GLOBAL_CONSTANTS.SECRET_TAG_START}${value}${GLOBAL_CONSTANTS.SECRET_TAG_END}`
      )
    );
  } catch (error) {
    logger.error("❌ Error:", { error });
    throw new CliError("Failed to get secret");
  }
};

export const secretRemoveCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--key": String,
      "-k": "--key",
    },
    { argv }
  );

  const logger = app.getLogger();
  const key = options["--key"];

  if (!key) {
    throw new ValidationError("Secret key is required");
  }

  try {
    await app.getSecretService().removeSecret(key);
    console.log(`✅ Secret '${key}' removed successfully!`);
  } catch (error) {
    logger.error("❌ Error:", { error });
    throw new CliError("Failed to remove secret");
  }
};
