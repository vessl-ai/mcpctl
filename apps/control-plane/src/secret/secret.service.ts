import { Injectable } from '@nestjs/common';
import { SecretRefSource } from '@repo/shared/types/domain/secret';
import { SecretStoreFactory } from './secret.store';
@Injectable()
export class SecretService {
  constructor(private readonly secretStoreFactory: SecretStoreFactory) {}

  // Set a secret value for a given key
  async set(
    sourceType: SecretRefSource,
    key: string,
    value: string,
  ): Promise<string> {
    const secretStore = this.secretStoreFactory.getSecretStore(sourceType);
    if (!secretStore) {
      throw new Error(`Secret store type ${sourceType} not found`);
    }
    const sanitizedKey = await secretStore.set(key, value);
    return sanitizedKey;
  }

  // Get the secret value for a given key
  async get(sourceType: SecretRefSource, key: string): Promise<string | null> {
    const secretStore = this.secretStoreFactory.getSecretStore(sourceType);
    if (!secretStore) {
      throw new Error(`Secret store type ${sourceType} not found`);
    }
    return secretStore.get(key);
  }

  // List all secret keys
  async list(sourceType: SecretRefSource): Promise<string[]> {
    const secretStore = this.secretStoreFactory.getSecretStore(sourceType);
    if (!secretStore) {
      throw new Error(`Secret store type ${sourceType} not found`);
    }
    return secretStore.list();
  }

  // Delete the secret for a given key
  async delete(sourceType: SecretRefSource, key: string): Promise<void> {
    const secretStore = this.secretStoreFactory.getSecretStore(sourceType);
    if (!secretStore) {
      throw new Error(`Secret store type ${sourceType} not found`);
    }
    await secretStore.delete(key);
  }
}
