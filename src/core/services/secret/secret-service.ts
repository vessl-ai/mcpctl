import { Logger } from "../../../lib/logger/logger";
import { SECRET_STORE } from "../../lib/constants";
import { ServerEnvConfig } from "../../lib/types/config";
import { SecretReference, SharedSecretsConfig } from "../../lib/types/secret";
import { ConfigService } from "../config/config-service";
import { SecretStore } from "./secret-store";
import { normalizeSecretKey } from "./util";
export interface SecretService {
  // 공용 시크릿 관리
  getSharedSecret(key: string): Promise<string | null>;
  setSharedSecret(
    key: string,
    value: string,
    description?: string
  ): Promise<void>;
  setSharedSecrets(
    secrets: Record<string, string>
  ): Promise<Record<string, SecretReference>>;
  removeSharedSecret(key: string): Promise<void>;
  listSharedSecrets(): Record<string, SecretReference>;

  // 프로필별 시크릿 관리
  getProfileSecret(profile: string, key: string): Promise<string | null>;
  setProfileSecret(profile: string, key: string, value: string): Promise<void>;
  removeProfileSecret(profile: string, key: string): Promise<void>;

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

  async getSharedSecret(key: string): Promise<string | null> {
    return this.secretStore.getSecret(SECRET_STORE.SHARED_PROFILE, key);
  }

  async setSharedSecret(
    key: string,
    value: string,
    description?: string
  ): Promise<void> {
    // 시크릿 값 저장
    await this.secretStore.setSecret(SECRET_STORE.SHARED_PROFILE, key, value);

    // 시크릿 참조 정보 설정에 저장
    const config = this.configService.getConfig();
    const secrets: SharedSecretsConfig = config.secrets || { shared: {} };

    secrets.shared[key] = {
      key,
      description: description || `Shared secret for ${key}`,
    };

    this.configService.updateConfig({
      ...config,
      secrets,
    });
  }

  async setSharedSecrets(
    secrets: Record<string, string>
  ): Promise<Record<string, SecretReference>> {
    const config = this.configService.getConfig();
    const secretConfig: SharedSecretsConfig = config.secrets || { shared: {} };

    const addedSecrets: Record<string, SecretReference> = {};
    for (const [key, value] of Object.entries(secrets)) {
      const secretKey = normalizeSecretKey(key);
      await this.secretStore.setSecret(
        SECRET_STORE.SHARED_PROFILE,
        secretKey,
        value
      );

      secretConfig.shared[key] = {
        key: secretKey,
        description: `Shared secret for ${key}`,
      };
      addedSecrets[key] = secretConfig.shared[key];
    }

    this.configService.updateConfig({
      ...config,
      secrets: secretConfig,
    });

    return addedSecrets;
  }

  async removeSharedSecret(key: string): Promise<void> {
    // 시크릿 값 삭제
    await this.secretStore.removeSecret(SECRET_STORE.SHARED_PROFILE, key);

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

  listSharedSecrets(): Record<string, SecretReference> {
    return this.configService.getConfig().secrets?.shared || {};
  }

  async getProfileSecret(profile: string, key: string): Promise<string | null> {
    return this.secretStore.getSecret(profile, key);
  }

  async setProfileSecret(
    profile: string,
    key: string,
    value: string
  ): Promise<void> {
    await this.secretStore.setSecret(profile, key, value);
  }

  async removeProfileSecret(profile: string, key: string): Promise<void> {
    await this.secretStore.removeSecret(profile, key);
  }

  async resolveEnv(
    envConfig: ServerEnvConfig,
    profile?: string
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {
      ...(this.configService.getConfig().sharedEnv || {}), // 공용 env 먼저
      ...(envConfig.env || {}), // 프로필별 env로 오버라이드
    };

    // 공용 시크릿 먼저 해석
    const sharedSecrets = this.listSharedSecrets();
    const sharedSecretEntries = await Promise.all(
      Object.entries(sharedSecrets).map(async ([envKey, secretRef]) => {
        const value = await this.getSharedSecret(secretRef.key);
        return value ? [envKey, value] : null;
      })
    );

    sharedSecretEntries
      .filter((entry): entry is [string, string] => entry !== null)
      .forEach(([key, value]) => {
        result[key] = value;
      });

    if (profile) {
      // 프로필별 시크릿으로 오버라이드
      const profileSecretEntries = await Promise.all(
        Object.entries(envConfig.secrets || {}).map(
          async ([envKey, secretRef]) => {
            const value = await this.getProfileSecret(profile, secretRef.key);
            return value ? [envKey, value] : null;
          }
        )
      );

      profileSecretEntries
        .filter((entry): entry is [string, string] => entry !== null)
        .forEach(([key, value]) => {
          result[key] = value;
        });
    }

    return result;
  }
}

export const newSecretService = (
  secretStore: SecretStore,
  configService: ConfigService,
  logger: Logger
): SecretService => new SecretServiceImpl(secretStore, configService, logger);
