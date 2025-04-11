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

const getConfigPath = (): string => {
  const configDir = process.env.MCPCTL_CONFIG_DIR;
  if (configDir) {
    return path.join(configDir, 'config.json');
  }
  const homeDir = os.homedir();
  return path.join(homeDir, '.mcpctl', 'config.json');
}


export {
  getConfigPath, getProfileDir, getProfileName
};

