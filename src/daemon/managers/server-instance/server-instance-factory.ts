import { Logger } from "../../../lib/logger/logger";
import { McpServerHostingType } from "../../../lib/types/hosting";
import { McpServerInstance } from "../../../lib/types/instance";
import { RunConfig, getRunConfigId } from "../../../lib/types/run-config";
import { LocalServerInstance } from "./server-instance-impl";

export interface ServerInstanceFactory {
  createServerInstance(
    config: RunConfig,
    logger: Logger
  ): Promise<McpServerInstance>;
}

class DefaultServerInstanceFactory implements ServerInstanceFactory {
  constructor(private logger: Logger) {
    this.logger = this.logger.withContext("ServerInstanceFactory");
  }

  async createServerInstance(config: RunConfig): Promise<McpServerInstance> {
    this.logger.info("Creating server instance", {
      configId: getRunConfigId(config),
      hosting: config.hosting,
    });

    try {
      if (config.hosting === McpServerHostingType.LOCAL) {
        this.logger.debug("Creating local server instance");
        const instance = new LocalServerInstance(config, this.logger);
        this.logger.info("Local server instance created successfully", {
          instanceId: instance.id,
        });
        return instance;
      }

      if (config.hosting === McpServerHostingType.REMOTE) {
        this.logger.error("Remote hosting type not supported");
        throw new Error(`Remote hosting is not supported yet`);
      }

      this.logger.error("Invalid hosting type", { hosting: config.hosting });
      throw new Error(`Unsupported hosting type: ${config.hosting}`);
    } catch (error) {
      this.logger.error("Failed to create server instance", {
        error,
        configId: getRunConfigId(config),
      });
      throw error;
    }
  }
}

export const newServerInstanceFactory = (
  logger: Logger
): ServerInstanceFactory => {
  return new DefaultServerInstanceFactory(logger);
};
