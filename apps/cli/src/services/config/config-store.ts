import { Logger } from "@vessl-ai/mcpctl-core/logger";
import { Config } from "@vessl-ai/mcpctl-core/types";
import fs from "fs";
import { getConfigDir, getConfigPath } from "../../env";
interface ConfigStore {
  getConfig: () => Config;
  saveConfig: (config: Config) => void;
}

class FileConfigStoreImpl implements ConfigStore {
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

const newFileConfigStore = (
  logger: Logger,
  configPath: string = getConfigPath()
): ConfigStore => {
  return new FileConfigStoreImpl(logger, configPath);
};

export { ConfigStore, FileConfigStoreImpl, newFileConfigStore };
