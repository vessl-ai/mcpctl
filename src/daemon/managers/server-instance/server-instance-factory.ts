import { SecretService } from '../../../core/services/secret/secret-service';
import { GLOBAL_CONSTANTS } from '../../../lib/constants';
import { Logger } from '../../../lib/logger/logger';
import { McpServerHostingType } from '../../../lib/types/hosting';
import { McpServerInstance } from '../../../lib/types/instance';
import { RunConfig, getRunConfigId } from '../../../lib/types/run-config';
import { LocalServerInstance } from './server-instance-impl';

export interface ServerInstanceFactory {
  createServerInstance(config: RunConfig, logger: Logger): Promise<McpServerInstance>;
}

class DefaultServerInstanceFactory implements ServerInstanceFactory {
  constructor(
    private readonly secretService: SecretService,
    private readonly logger: Logger
  ) {}

  private async resolveSecrets(config: RunConfig): Promise<RunConfig> {
    const resolvedConfig = { ...config };
    if (!resolvedConfig.env) {
      resolvedConfig.env = {};
    }
    for (const [key, ref] of Object.entries(config.secrets || {})) {
      const secret = await this.secretService.getProfileSecret(config.profileName, ref.key);
      if (secret) {
        resolvedConfig.env[key] = secret;
        continue;
      }
      const sharedSecret = await this.secretService.getSharedSecret(ref.key);
      if (sharedSecret) {
        resolvedConfig.env[key] = sharedSecret;
        continue;
      }
      throw new Error(`Secret ${ref.key} not found`);
    }
    return resolvedConfig;
  }

  async createServerInstance(config: RunConfig): Promise<McpServerInstance> {
    this.logger.info('Creating server instance', {
      configId: getRunConfigId(config),
      hosting: config.hosting,
    });

    const resolvedConfig = await this.resolveSecrets(config);

    this.logger.debug('Resolved config', {
      ...resolvedConfig,
      env: Object.keys(resolvedConfig.env || {}).map(key => {
        if (resolvedConfig.secrets?.[key]) {
          return {
            key,
            // mask secret
            value: `${GLOBAL_CONSTANTS.SECRET_TAG_START}${resolvedConfig.env?.[key]}${GLOBAL_CONSTANTS.SECRET_TAG_END}`,
          };
        }
        return { key, value: resolvedConfig.env?.[key] };
      }),
    });

    try {
      if (resolvedConfig.hosting === McpServerHostingType.LOCAL) {
        this.logger.debug('Creating local server instance');
        const instance = new LocalServerInstance(resolvedConfig, this.logger);
        this.logger.info('Local server instance created successfully', {
          instanceId: instance.id,
        });
        return instance;
      }

      if (resolvedConfig.hosting === McpServerHostingType.REMOTE) {
        this.logger.error('Remote hosting type not supported');
        throw new Error(`Remote hosting is not supported yet`);
      }

      this.logger.error('Invalid hosting type', {
        hosting: resolvedConfig.hosting,
      });
      throw new Error(`Unsupported hosting type: ${resolvedConfig.hosting}`);
    } catch (error) {
      this.logger.error('Failed to create server instance', {
        error,
        configId: getRunConfigId(resolvedConfig),
      });
      throw error;
    }
  }
}

export const newServerInstanceFactory = (secretService: SecretService, logger: Logger): ServerInstanceFactory => {
  return new DefaultServerInstanceFactory(secretService, logger);
};
