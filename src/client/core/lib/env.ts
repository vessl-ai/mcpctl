import os from 'os';
import path from 'path';

const getProfileName = (): string => {
  const profileName = process.env.MCPCTL_PROFILE;
  if (profileName) {
    return profileName;
  }
  return "default";
}

const getProfileDir = (): string => {
  const profileDir = process.env.MCPCTL_PROFILE_DIR;
  if (profileDir) {
    return profileDir;
  }
  const homeDir = os.homedir();
  return path.join(homeDir, '.mcpctl', 'profiles');
}

const getConfigDir = (): string => {
  const configDir = process.env.MCPCTL_CONFIG_DIR;
  if (configDir) {
    return configDir;
  } 
  const homeDir = os.homedir();
  return path.join(homeDir, '.mcpctl', 'config');
}

const getConfigPath = (): string => {
  const configDir = getConfigDir();
  return path.join(configDir, 'config.json');
}

const getSocketPath = (): string => {
  const socketPath = process.env.MCPCTL_SOCKET_PATH;
  if (socketPath) {
    return socketPath;
  }
  return "/tmp/mcp-daemon.sock";
}

const getSessionDir = (): string => {
  const sessionDir = process.env.MCPCTL_SESSION_DIR;
  if (sessionDir) {
    return sessionDir;
  }
  return path.join(os.homedir(), '.mcpctl', 'sessions');
}

const verboseLog = (): boolean => {
  const verbose = process.env.MCPCTL_VERBOSE;
  if (verbose) {
    return verbose === 'true';
  }
  return false;
}


export { getConfigDir, getConfigPath, getProfileDir, getProfileName, getSessionDir, getSocketPath, verboseLog };

