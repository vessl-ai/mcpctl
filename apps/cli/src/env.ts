import { Config } from "@vessl-ai/mcpctl-core/config";
import os from "os";
import path from "path";

const shouldMaskSecret = () => {
  const env = process.env.MASK_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  // Override masking with MASK_SECRET if provided
  if (env) {
    if (env.toLowerCase() === "true") {
      return true;
    } else {
      return false;
    }
  }

  // Default behavior: no masking in development, mask in other environments
  return nodeEnv !== "development";
};

export const GLOBAL_ENV = {
  MASK_SECRET: shouldMaskSecret(),
};

export const getProfileName = (): string => {
  const profileName = process.env.MCPCTL_PROFILE;
  if (profileName) {
    return profileName;
  }
  return "default";
};

export const getProfileDir = (): string => {
  const profileDir = process.env.MCPCTL_PROFILE_DIR;
  if (profileDir) {
    return profileDir;
  }
  const homeDir = os.homedir();
  return path.join(homeDir, ".mcpctl", "profiles");
};

export const getConfigDir = (): string => {
  const configDir = process.env.MCPCTL_CONFIG_DIR;
  if (configDir) {
    return configDir;
  }
  return Config.Path.CONFIG_PATHS[
    os.platform() as keyof typeof Config.Path.CONFIG_PATHS
  ];
};

export const getConfigPath = (): string => {
  const configDir = getConfigDir();
  return path.join(configDir, "config.json");
};

export const getSocketPath = (): string => {
  const socketPath = process.env.MCPCTL_SOCKET_PATH;
  if (socketPath) {
    return socketPath;
  }
  return "/tmp/mcp-daemon.sock";
};

export const getSessionDir = (): string => {
  const sessionDir = process.env.MCPCTL_SESSION_DIR;
  if (sessionDir) {
    return sessionDir;
  }
  return path.join(os.homedir(), ".mcpctl", "sessions");
};
