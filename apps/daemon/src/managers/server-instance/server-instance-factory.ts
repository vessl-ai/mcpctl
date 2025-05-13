import { Config } from "@vessl-ai/mcpctl-core/config";
import { Logger } from "@vessl-ai/mcpctl-core/logger";
import {
  McpServerHostingType,
  McpServerInstance,
  RunConfig,
  getRunConfigId,
} from "@vessl-ai/mcpctl-core/types";
import { PortService } from "../../services/port/port-service";
import { SecretService } from "../../services/secret/secret-service";
import { LocalServerInstance } from "./server-instance-impl";
export interface ServerInstanceFactory {
  createServerInstance(config: RunConfig): Promise<McpServerInstance>;
}

class DefaultServerInstanceFactory implements ServerInstanceFactory {
  constructor(
    private readonly secretService: SecretService,
    private readonly logger: Logger,
    private readonly portService: PortService
  ) {}

  async createServerInstance(config: RunConfig): Promise<McpServerInstance> {
    this.logger.info("Creating server instance", {
      configId: getRunConfigId(config),
      hosting: config.hosting,
    });

    const resolvedConfig = await this.resolveSecrets(config);

    this.logger.debug("Resolved config", {
      ...resolvedConfig,
      env: Object.keys(resolvedConfig.env || {}).map((key) => {
        if (resolvedConfig.secrets?.[key]) {
          return {
            key,
            // mask secret
            value: `${Config.Secret.SECRET_TAG_START}${resolvedConfig.env?.[key]}${Config.Secret.SECRET_TAG_END}`,
          };
        }
        return { key, value: resolvedConfig.env?.[key] };
      }),
    });

    try {
      if (resolvedConfig.hosting === McpServerHostingType.LOCAL) {
        this.logger.debug("Creating local server instance");
        const instance = new LocalServerInstance(
          resolvedConfig,
          this.logger.withContext("LocalServerInstance"),
          this.portService
        );
        this.logger.info("Local server instance created successfully", {
          instanceId: instance.id,
        });
        return instance;
      }

      if (resolvedConfig.hosting === McpServerHostingType.REMOTE) {
        this.logger.error("Remote hosting type not supported");
        throw new Error(`Remote hosting is not supported yet`);
      }

      this.logger.error("Invalid hosting type", {
        hosting: resolvedConfig.hosting,
      });
      throw new Error(`Unsupported hosting type: ${resolvedConfig.hosting}`);
    } catch (error) {
      this.logger.error("Failed to create server instance", {
        error,
        configId: getRunConfigId(resolvedConfig),
      });
      throw error;
    }
  }

  private async resolveSecrets(config: RunConfig): Promise<RunConfig> {
    if (!config.secrets || Object.keys(config.secrets).length === 0) {
      return config;
    }

    const resolvedConfig = { ...config };
    const resolvedSecrets: Record<string, string> = {};

    for (const [key, secretRef] of Object.entries(config.secrets)) {
      try {
        const secret = await this.secretService.getSecret(secretRef.key);
        if (!secret) {
          throw new Error(`Secret ${secretRef.key} not found`);
        }
        resolvedSecrets[key] = secret;
      } catch (error) {
        this.logger.error("Failed to resolve secret", {
          error,
          secretRef,
          key,
        });
        throw error;
      }
    }

    resolvedConfig.env = {
      ...resolvedConfig.env,
      ...resolvedSecrets,
    };

    return resolvedConfig;
  }
}

export const newServerInstanceFactory = (
  secretService: SecretService,
  logger: Logger,
  portService: PortService
): ServerInstanceFactory => {
  return new DefaultServerInstanceFactory(secretService, logger, portService);
};
