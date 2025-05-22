import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretRefSource } from '@repo/shared/types/domain/secret';
import {
  deletePassword,
  findCredentials,
  getPassword,
  setPassword,
} from 'keytar';
import { SecretConfig } from '../config/secret.config';

export interface SecretStore {
  set(key: string, value: string): Promise<string>;
  get(key: string): Promise<string | null>;
  list(): Promise<string[]>;
  delete(key: string): Promise<void>;
}

export class KeychainSecretStore implements SecretStore {
  private readonly KEYCHAIN_SERVICE_PREFIX = 'mcpctl';

  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9]/g, '_');
  }

  // Set a secret value for a given key
  async set(key: string, value: string): Promise<string> {
    const sanitizedKey = this.sanitizeKey(key);
    await setPassword(this.KEYCHAIN_SERVICE_PREFIX, sanitizedKey, value);
    return sanitizedKey;
  }

  // Get the secret value for a given key
  async get(key: string): Promise<string | null> {
    return getPassword(this.KEYCHAIN_SERVICE_PREFIX, this.sanitizeKey(key));
  }

  // List all secret keys
  async list(): Promise<string[]> {
    const allCredentials = await findCredentials(this.KEYCHAIN_SERVICE_PREFIX);
    return allCredentials.map((credential) => credential.account);
  }

  // Delete the secret for a given key
  async delete(key: string): Promise<void> {
    await deletePassword(this.KEYCHAIN_SERVICE_PREFIX, this.sanitizeKey(key));
  }
}

export class VaultSecretStore implements SecretStore {
  // Set a secret value for a given key
  async set(key: string, value: string): Promise<string> {
    // Implementation needed
    throw new Error('Not implemented');
  }

  // Get the secret value for a given key
  async get(key: string): Promise<string | null> {
    // Implementation needed
    throw new Error('Not implemented');
  }

  // List all secret keys
  async list(): Promise<string[]> {
    // Implementation needed
    throw new Error('Not implemented');
  }

  // Delete the secret for a given key
  async delete(key: string): Promise<void> {
    // Implementation needed
    throw new Error('Not implemented');
  }
}

@Injectable()
export class SecretStoreFactory {
  private readonly secretStores: Record<SecretRefSource, SecretStore>;

  constructor(private readonly configService: ConfigService) {
    const secretConfig = configService.get<SecretConfig>('secret');
    if (!secretConfig) {
      throw new Error('Secret config not found');
    }
    this.secretStores = secretConfig.storeTypes.reduce(
      (acc, type) => {
        acc[type] = this.createSecretStore(type);
        return acc;
      },
      {} as Record<SecretRefSource, SecretStore>,
    );
  }

  private createSecretStore(type: SecretRefSource): SecretStore {
    switch (type) {
      case SecretRefSource.Keychain:
        return new KeychainSecretStore();
      case SecretRefSource.Vault:
        return new VaultSecretStore();
    }
  }

  getSecretStore(type: SecretRefSource): SecretStore | undefined {
    return this.secretStores[type];
  }
}
