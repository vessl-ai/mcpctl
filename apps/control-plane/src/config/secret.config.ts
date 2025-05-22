import { registerAs } from '@nestjs/config';
import { SecretRefSource } from '@repo/shared/types/domain/secret';

export interface SecretConfig {
  storeTypes: SecretRefSource[];
}

export const secretConfiguration = registerAs('secret', (): SecretConfig => {
  const storeTypes = (process.env.SECRET_STORE_TYPES || 'keychain')
    .split(',')
    .map((e) => e.trim())
    .map((x) => x as SecretRefSource);
  return {
    storeTypes,
  };
});
