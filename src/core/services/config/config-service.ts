import { Config } from '../../lib/types/config';
import { ConfigStore } from './config-store';
import { defaultConfig } from './default-config';
interface ConfigService {
  getConfig: () => Config;
  getConfigSection<T extends keyof Config>(section: T): Config[T];
  saveConfig: () => void;
  updateConfig: (config: Partial<Config>) => void;
}

class ConfigServiceImpl implements ConfigService {
  private config: Config;

  constructor(
    private readonly configStore: ConfigStore,
    initialConfig?: Config
  ) {
    if (initialConfig) {
      this.config = initialConfig;
    } else {
      this.config = this.configStore.getConfig();
      if (!this.config || Object.keys(this.config).length === 0) {
        this.config = defaultConfig;
        this.configStore.saveConfig(this.config);
      }
    }
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

  public updateConfig(config: Partial<Config>): void {
    this.config = { ...this.config, ...config };
    this.configStore.saveConfig(this.config);
  }
}

const newConfigService = (configStore: ConfigStore, initialConfig?: Config): ConfigService => {
  return new ConfigServiceImpl(configStore, initialConfig);
};

export { ConfigService, ConfigServiceImpl, newConfigService };
