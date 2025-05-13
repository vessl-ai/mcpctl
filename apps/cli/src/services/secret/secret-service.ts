import { Config } from "@vessl-ai/mcpctl-core/config";
import { Logger } from "@vessl-ai/mcpctl-core/logger";
import {
  SecretReference,
  ServerEnvConfig,
  SharedSecretsConfig,
} from "@vessl-ai/mcpctl-core/types";
import { ConfigService } from "../config/config-service";
import { SecretStore } from "./secret-store";
import { normalizeSecretKey } from "./util";

export interface SecretService {
  // 시크릿 관리
  getSecret(key: string): Promise<string | null>;
  setSecret(
    key: string,
    value: string,
    description?: string,
    tags?: string[]
  ): Promise<void>;
  setSecrets(
    secrets: Record<string, string>,
    description?: string,
    tags?: string[]
  ): Promise<Record<string, SecretReference>>;
  removeSecret(key: string): Promise<void>;
  listSecrets(tags?: string[]): Record<string, SecretReference>;

  // 환경변수 해석 (시크릿 포함)
  resolveEnv(
    envConfig: ServerEnvConfig,
    profile?: string
  ): Promise<Record<string, string>>;
}

export class SecretServiceImpl implements SecretService {
  constructor(
    private readonly secretStore: SecretStore,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {}

  async getSecret(key: string): Promise<string | null> {
    try {
      return this.secretStore.getSecret(
        Config.Secret.SECRET_STORE.SHARED_PROFILE,
        key
      );
    } catch (error) {
      this.logger.error("Error getting secret", {
        key,
        error,
      });
      return null;
    }
  }

  async setSecret(
    key: string,
    value: string,
    description?: string,
    tags?: string[]
  ): Promise<void> {
    // 시크릿 값 저장
    await this.secretStore.setSecret(
      Config.Secret.SECRET_STORE.SHARED_PROFILE,
      key,
      value
    );

    // 시크릿 참조 정보 설정에 저장
    const config = this.configService.getConfig();
    const secrets: SharedSecretsConfig = config.secrets || { shared: {} };

    secrets.shared[key] = {
      key,
      description: description || `Secret for ${key}`,
      tags,
    };

    this.configService.updateConfig({
      ...config,
      secrets,
    });
  }

  async setSecrets(
    secrets: Record<string, string>,
    description?: string,
    tags?: string[]
  ): Promise<Record<string, SecretReference>> {
    const config = this.configService.getConfig();
    const secretConfig: SharedSecretsConfig = config.secrets || { shared: {} };

    const addedSecrets: Record<string, SecretReference> = {};
    for (const [key, value] of Object.entries(secrets)) {
      const secretKey = normalizeSecretKey(key);
      await this.secretStore.setSecret(
        Config.Secret.SECRET_STORE.SHARED_PROFILE,
        secretKey,
        value
      );

      secretConfig.shared[key] = {
        key: secretKey,
        description: description || `Secret for ${key}`,
        tags,
      };
      addedSecrets[key] = secretConfig.shared[key];
    }

    this.configService.updateConfig({
      ...config,
      secrets: secretConfig,
    });

    return addedSecrets;
  }

  async removeSecret(key: string): Promise<void> {
    // 시크릿 값 삭제
    await this.secretStore.removeSecret(
      Config.Secret.SECRET_STORE.SHARED_PROFILE,
      key
    );

    // 시크릿 참조 정보 삭제
    const config = this.configService.getConfig();
    if (config.secrets?.shared) {
      const { [key]: _, ...remaining } = config.secrets.shared;
      this.configService.updateConfig({
        ...config,
        secrets: {
          ...config.secrets,
          shared: remaining,
        },
      });
    }
  }

  listSecrets(tags?: string[]): Record<string, SecretReference> {
    const secrets = this.configService.getConfig().secrets?.shared || {};

    if (!tags || tags.length === 0) {
      return secrets;
    }

    return Object.fromEntries(
      Object.entries(secrets).filter(([_, secret]) =>
        secret.tags?.some((tag) => tags.includes(tag))
      )
    );
  }

  async resolveEnv(
    envConfig: ServerEnvConfig,
    profile?: string
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {
      ...(this.configService.getConfig().sharedEnv || {}), // 공용 env 먼저
      ...(envConfig.env || {}), // 프로필별 env로 오버라이드
    };

    // 시크릿 해석
    const secrets = this.listSecrets();
    const secretEntries = await Promise.all(
      Object.entries(secrets).map(async ([envKey, secretRef]) => {
        const value = await this.getSecret(secretRef.key);
        return value ? [envKey, value] : null;
      })
    );

    secretEntries
      .filter((entry): entry is [string, string] => entry !== null)
      .forEach(([key, value]) => {
        result[key] = value;
      });

    return result;
  }
}

export const newSecretService = (
  secretStore: SecretStore,
  configService: ConfigService,
  logger: Logger
): SecretService => new SecretServiceImpl(secretStore, configService, logger);
