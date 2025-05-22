import {
  KeychainSecretStore,
  secretStoreFactory,
  SecretStoreType,
  VaultSecretStore,
} from './secret.store';

describe('SecretStore', () => {
  describe('factory', () => {
    it('should return a KeychainSecretStore', () => {
      const store = secretStoreFactory(SecretStoreType.Keychain);
      expect(store).toBeInstanceOf(KeychainSecretStore);
    });

    it('should return a VaultSecretStore', () => {
      const store = secretStoreFactory(SecretStoreType.Vault);
      expect(store).toBeInstanceOf(VaultSecretStore);
    });
  });
});
