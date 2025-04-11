import fs from 'fs';
import { getConfigPath } from "../lib/env";
import { Config } from "./config";

interface ConfigStore {
  getConfig: () => Config;
  saveConfig: (config: Config) => void;
}


class FileConfigStoreImpl implements ConfigStore {


  constructor(private readonly configPath: string = getConfigPath()) {
  }

  getConfig(): Config {
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }
  
  saveConfig(config: Config): void {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }
} 

const newFileConfigStore = (configPath: string = getConfigPath()): ConfigStore => {
  return new FileConfigStoreImpl(configPath);
}

export {
  ConfigStore,
  FileConfigStoreImpl,
  newFileConfigStore
};
