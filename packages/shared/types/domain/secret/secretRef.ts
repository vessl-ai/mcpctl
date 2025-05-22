export enum SecretRefSource {
  Keychain = "keychain",
  Vault = "vault",
}

export interface SecretRef {
  source: SecretRefSource;
  key: string;
}
