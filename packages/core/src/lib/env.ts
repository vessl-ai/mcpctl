import { LogLevel } from "@mcpctl/lib";
import os from "os";
import path from "path";
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
  const homeDir = os.homedir();
  return path.join(homeDir, ".mcpctl", "config");
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

export const logLevel = (): LogLevel => {
  let logLevel = process.env.MCPCTL_LOG_LEVEL;
  if (!logLevel) {
    return LogLevel.INFO;
  }
  logLevel = logLevel.trim().toLowerCase();
  switch (logLevel) {
    case "verbose":
      return LogLevel.VERBOSE;
    case "debug":
      return LogLevel.DEBUG;
    case "info":
      return LogLevel.INFO;
    case "warn":
      return LogLevel.WARN;
    case "error":
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
};
