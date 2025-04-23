import arg from "arg";
import {
  CliError,
  ResourceNotFoundError,
  ValidationError,
} from "../../../../lib/errors";
import { App } from "../../app";

export const envCommand = async (app: App, argv: string[]) => {
  const options = arg({}, { argv, permissive: true });

  const subcommand = options["_"]?.[0];

  switch (subcommand) {
    case "set":
      await envSetCommand(app, argv);
      break;
    case "get":
      await envGetCommand(app, argv);
      break;
    case "remove":
      await envRemoveCommand(app, argv);
      break;
    case "list":
      await envListCommand(app, argv);
      break;
    default:
      throw new ValidationError(
        "Unknown subcommand. Available subcommands: set, get"
      );
  }
};

export const envRemoveCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--profile": String,
      "--server": String,
      "--shared": Boolean,
      "--env": [String],
      "-p": "--profile",
      "-s": "--server",
      "-g": "--shared",
      "-e": "--env",
    },
    { argv }
  );

  const logger = app.getLogger();
  const profileName = options["--profile"];
  const serverName = options["--server"];
  const isShared = options["--shared"] || false;

  // Check for conflicting options
  if (isShared && (profileName || serverName)) {
    logger.error("Error: Cannot use --shared with --profile or --server");
    throw new ValidationError("Cannot use --shared with --profile or --server");
  }

  if (profileName && !serverName) {
    logger.error(
      "Error: Profile name is required (--profile, -p) when using --server"
    );
    throw new ValidationError("Profile name is required when using server");
  }

  const envVars: string[] = options["--env"] || [];

  try {
    if (isShared) {
      const config = app.getConfigService().getConfig();
      const currentSharedEnv = config.sharedEnv || {};

      if (Object.keys(currentSharedEnv).length === 0) {
        console.log("No shared environment variables to remove");
        return;
      }

      const updatedSharedEnv = { ...currentSharedEnv };
      for (const key of envVars) {
        delete updatedSharedEnv[key];
      }

      app.getConfigService().updateConfig({
        sharedEnv: updatedSharedEnv,
      });

      console.log("✅ Shared environment variables updated successfully!");
    } else {
      const profile = app.getProfileService().getProfile(profileName!);
      if (!profile) {
        logger.error(`Profile '${profileName}' not found`);
        throw new ResourceNotFoundError(`Profile '${profileName}' not found`);
      }

      const server = profile.servers[serverName!];
      if (!server) {
        logger.error(
          `Server '${serverName}' not found in profile '${profileName}'`
        );
        throw new ResourceNotFoundError(
          `Server '${serverName}' not found in profile '${profileName}'`
        );
      }

      await app
        .getProfileService()
        .removeProfileEnvForServer(profileName!, serverName!, envVars);

      console.log("✅ Environment variables updated successfully!");
    }
  } catch (error) {
    logger.error("❌ Error:", { error });
    throw new CliError("Failed to remove environment variables");
  }
};

export const envListCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--profile": String,
      "--server": String,
      "--shared": Boolean,
      "-p": "--profile",
      "-s": "--server",
      "-g": "--shared",
    },
    { argv }
  );

  const logger = app.getLogger();
  const profileName = options["--profile"];
  const serverName = options["--server"];
  const isShared = options["--shared"] || false;

  // Check for conflicting options
  if (isShared && (profileName || serverName)) {
    logger.error("Error: Cannot use --shared with --profile or --server");
    throw new ValidationError("Cannot use --shared with --profile or --server");
  }

  // Check for incomplete profile options
  if (profileName && !serverName) {
    const profile = app.getProfileService().getProfile(profileName);
    if (!profile) {
      logger.error(`Profile '${profileName}' not found`);
      throw new ResourceNotFoundError(`Profile '${profileName}' not found`);
    }

    console.log(`\n🔍 Environment variables for profile '${profileName}':`);
    console.log("=".repeat(50));

    const servers = Object.keys(profile.servers);
    if (servers.length === 0) {
      console.log("  No servers found in profile");
      return;
    }

    for (const server of servers) {
      const env = profile.servers[server]?.env?.env || {};

      // Skip if no environment variables
      if (Object.keys(env).length === 0) {
        continue;
      }

      console.log(`\n📌 Server: ${server}`);
      console.log("-".repeat(20));

      for (const [key, value] of Object.entries(env)) {
        console.log(`  - ${key}: ${value}`);
      }
    }
    return;
  }

  if (serverName && !profileName) {
    logger.error(
      "Error: Profile name is required (--profile, -p) when using --server"
    );
    throw new ValidationError("Profile name is required when using server");
  }

  try {
    // Show all environment variables when no options are provided
    if (!isShared && !profileName && !serverName) {
      console.log("\n🔍 All environment variables:");
      console.log("==========================");

      // Show shared environment variables
      const sharedEnv =
        app.getConfigService().getConfigSection("sharedEnv") || {};
      if (Object.keys(sharedEnv).length > 0) {
        console.log("\n📌 Shared environment variables:");
        console.log("------------------------------");
        for (const [key, value] of Object.entries(sharedEnv)) {
          console.log(`  - ${key}: ${value}`);
        }
      }

      // Show all profile/server environment variables
      const profiles = app.getProfileService().listProfiles();
      for (const profile of profiles) {
        for (const [serverName, server] of Object.entries(profile.servers)) {
          const env = server.env?.env || {};
          if (Object.keys(env).length > 0) {
            console.log(`\n📌 ${profile.name}/${serverName}:`);
            console.log(
              "-".repeat(profile.name.length + serverName.length + 4)
            );
            Object.entries(env).forEach(([key, value]) => {
              console.log(`  - ${key}: ${value}`);
            });
          }
        }
      }
      return;
    }

    // Show shared environment variables
    if (isShared) {
      const sharedEnv =
        app.getConfigService().getConfigSection("sharedEnv") || {};
      console.log("\n🔍 Shared environment variables:");
      console.log("==============================");

      if (Object.keys(sharedEnv).length === 0) {
        console.log("  No shared environment variables set");
      } else {
        for (const [key, value] of Object.entries(sharedEnv)) {
          console.log(`  - ${key}: ${value}`);
        }
      }
      return;
    }

    // Show specific profile/server environment variables
    const profile = app.getProfileService().getProfile(profileName!);
    if (!profile) {
      logger.error(`Profile '${profileName}' not found`);
      throw new ResourceNotFoundError(`Profile '${profileName}' not found`);
    }

    const server = profile.servers[serverName!];
    if (!server) {
      logger.error(
        `Server '${serverName}' not found in profile '${profileName}'`
      );
      throw new ResourceNotFoundError(
        `Server '${serverName}' not found in profile '${profileName}'`
      );
    }

    const env = server.env?.env || {};

    console.log(`\n🔍 Environment variables for ${profileName}/${serverName}:`);
    console.log("==========================================");

    if (Object.keys(env).length === 0) {
      console.log("  No environment variables set");
    } else {
      Object.entries(env).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value}`);
      });
    }
  } catch (error) {
    logger.error("❌ Error:", { error });
    throw new CliError("Failed to list environment variables");
  }
};

export const envSetCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--profile": String,
      "--server": String,
      "--env": [String],
      "--shared": Boolean,
      "-p": "--profile",
      "-s": "--server",
      "-e": "--env",
      "-g": "--shared",
    },
    { argv }
  );

  const logger = app.getLogger();

  const profileName = options["--profile"];
  const serverName = options["--server"];
  const isShared = options["--shared"] || false;
  const envVars: string[] = options["--env"] || [];

  // 프로필 모드와 공유 모드 동시 사용 방지
  if (isShared && (profileName || serverName)) {
    logger.error("Error: Cannot use --shared with --profile or --server");
    throw new ValidationError("Cannot use --shared with --profile or --server");
  }

  // 프로필 모드 검증
  if (!isShared) {
    if (!profileName) {
      logger.error(
        "Error: Profile name is required (--profile, -p) when not using --shared"
      );
      throw new ValidationError("Profile name is required");
    }

    if (!serverName) {
      logger.error(
        "Error: Server name is required (--server, -s) when not using --shared"
      );
      throw new ValidationError("Server name is required");
    }
  }

  if (envVars.length === 0) {
    logger.error(
      "Error: At least one environment variable is required (--env, -e)"
    );
    throw new ValidationError("At least one environment variable is required");
  }

  try {
    const envPairs = envVars.map((e) => {
      const [key, value] = e.split("=");
      if (!key || !value) {
        throw new Error(
          `Invalid environment variable format: ${e}. Expected format: KEY=VALUE`
        );
      }
      return [key, value] as [string, string];
    });

    const envRecord = Object.fromEntries(envPairs);

    if (isShared) {
      // 공유 환경변수 설정
      const config = app.getConfigService().getConfig();
      const currentSharedEnv = config.sharedEnv || {};

      app.getConfigService().updateConfig({
        sharedEnv: {
          ...currentSharedEnv,
          ...envRecord,
        },
      });

      console.log("✅ Shared environment variables updated successfully!");
    } else {
      // 프로필별 환경변수 설정
      await app
        .getProfileService()
        .upsertProfileEnvForServer(profileName!, serverName!, envRecord);
      console.log(
        `✅ Environment variables updated successfully for ${profileName}/${serverName}!`
      );
    }

    console.log("\nUpdated environment variables:");
    Object.entries(envRecord).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
  } catch (error) {
    logger.error("❌ Failed to update environment variables:", { error });
    throw new CliError("Failed to update environment variables", error);
  }
};

export const envGetCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      "--profile": String,
      "--server": String,
      "--shared": Boolean,
      "-p": "--profile",
      "-s": "--server",
      "-g": "--shared",
    },
    { argv }
  );

  const logger = app.getLogger();

  const profileName = options["--profile"];
  const serverName = options["--server"];
  const isShared = options["--shared"] || false;

  // 프로필 모드와 공유 모드 동시 사용 방지
  if (isShared && (profileName || serverName)) {
    logger.error("Error: Cannot use --shared with --profile or --server");
    throw new ValidationError("Cannot use --shared with --profile or --server");
  }

  // 프로필 모드 검증
  if (!isShared) {
    if (!profileName) {
      logger.error(
        "Error: Profile name is required (--profile, -p) when not using --shared"
      );
      throw new ValidationError("Profile name is required");
    }

    if (!serverName) {
      logger.error(
        "Error: Server name is required (--server, -s) when not using --shared"
      );
      throw new ValidationError("Server name is required");
    }
  }

  try {
    if (isShared) {
      // 공유 환경변수 조회
      const sharedEnv =
        app.getConfigService().getConfigSection("sharedEnv") || {};

      console.log("\n🔍 Shared environment variables:");
      console.log("==============================");

      if (Object.keys(sharedEnv).length === 0) {
        console.log("  No shared environment variables set");
      } else {
        Object.entries(sharedEnv).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`);
        });
      }
    } else {
      // 프로필별 환경변수 조회
      const profile = app.getProfileService().getProfile(profileName!);
      if (!profile) {
        logger.error(`Profile '${profileName}' not found`);
        throw new ResourceNotFoundError(`Profile '${profileName}' not found`);
      }

      const server = profile.servers[serverName!];
      if (!server) {
        logger.error(
          `Server '${serverName}' not found in profile '${profileName}'`
        );
        throw new ResourceNotFoundError(
          `Server '${serverName}' not found in profile '${profileName}'`
        );
      }

      const envConfig = await app
        .getProfileService()
        .getProfileEnvForServer(profileName!, serverName!);

      const env = envConfig.env;

      console.log(
        `\n🔍 Environment variables for ${profileName}/${serverName}:`
      );
      console.log("==========================================");

      if (!env || Object.keys(env).length === 0) {
        console.log("  No environment variables set");
      } else {
        Object.entries(env).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`);
        });
      }
    }
  } catch (error) {
    logger.error("❌ Error:", { error });
    throw new CliError("Failed to get environment variables");
  }
};
