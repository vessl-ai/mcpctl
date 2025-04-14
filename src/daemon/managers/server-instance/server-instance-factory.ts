import { Logger } from "../../../lib/logger/logger";
import { McpServerHostingType } from "../../../lib/types/hosting";
import { McpServerInstance } from "../../../lib/types/instance";
import { RunConfig } from "../../../lib/types/run-config";
import { LocalServerInstance } from "./server-instance-impl";


export interface ServerInstanceFactory {
  createServerInstance(config: RunConfig, logger: Logger): Promise<McpServerInstance>;
}

class DefaultServerInstanceFactory implements ServerInstanceFactory {
  constructor(private logger: Logger) {
    this.logger = this.logger.withContext('ServerInstanceFactory');
  }

  async createServerInstance(config: RunConfig): Promise<McpServerInstance> {
    if (config.hosting === McpServerHostingType.LOCAL) {
      return new LocalServerInstance(config, this.logger);
    }
    if (config.hosting === McpServerHostingType.REMOTE) {
      // TODO: Containerized ones
      throw new Error(`Remote hosting is not supported yet`);
    }
    throw new Error(`Unsupported hosting type: ${config.hosting}`);
  }
}

export const newServerInstanceFactory = (logger: Logger): ServerInstanceFactory => {
  return new DefaultServerInstanceFactory(logger);
}
