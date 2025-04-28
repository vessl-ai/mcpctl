import { Logger } from "@mcpctl/lib";
import fs from "fs";
import { getConfigDir, getConfigPath } from "../../lib/env";
import { Config } from "../../lib/types/config";
export interface ConfigStore {
  getConfig: () => Config;
  saveConfig: (config: Config) => void;
}

export class FileConfigStoreImpl implements ConfigStore {
  constructor(
    private readonly logger: Logger,
    private readonly configPath: string = getConfigPath()
  ) {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(getConfigDir(), { recursive: true });
      fs.writeFileSync(this.configPath, JSON.stringify({}));
    }
  }

  getConfig(): Config {
    this.logger.verbose(`Loading config from ${this.configPath}`);
    const config = JSON.parse(fs.readFileSync(this.configPath, "utf8"));
    this.logger.verbose(`Loaded config: ${JSON.stringify(config, null, 2)}`);
    return config;
  }

  saveConfig(config: Config): void {
    this.logger.verbose(
      `Saving config to ${this.configPath}, ${JSON.stringify(config, null, 2)}`
    );
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    this.logger.verbose(`Saved config to ${this.configPath}`);
  }
}

export const newFileConfigStore = (
  logger: Logger,
  configPath: string = getConfigPath()
): ConfigStore => {
  return new FileConfigStoreImpl(logger, configPath);
};
