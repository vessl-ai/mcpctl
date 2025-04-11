import { Config, defaultConfig } from "./config";
import { ConfigStore } from "./config-store";
interface ConfigService {
  getConfig: () => Config;
  getConfigSection<T extends keyof Config>(section: T): Config[T];
  saveConfig: () => void;
}

class ConfigServiceImpl implements ConfigService {

  private config: Config;

  constructor(
    private readonly configStore: ConfigStore,
    initialConfig?: Config
  ) {
    this.config = initialConfig ?? defaultConfig;
  }

  public getConfig(): Config {
    return this.config;
  }

  public getConfigSection<T>(section: string): T {
    return this.config[section as keyof Config] as T;
  }

  public saveConfig(): void {
    this.configStore.saveConfig(this.config);
  }

}

const newConfigService = (configStore: ConfigStore, initialConfig?: Config): ConfigService => {
  return new ConfigServiceImpl(configStore, initialConfig);
}

export {
  ConfigService,
  ConfigServiceImpl,
  newConfigService
};
