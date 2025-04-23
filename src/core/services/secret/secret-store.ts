import keytar from "keytar";
import { SECRET_STORE } from "../../lib/constants";

// 시크릿 저장소 인터페이스
export interface SecretStore {
  getSecret(profile: string, key: string): Promise<string | null>;
  setSecret(profile: string, key: string, value: string): Promise<void>;
  removeSecret(profile: string, key: string): Promise<boolean>;
  removeAllSecrets(profile: string): Promise<void>;
}

// 기본 키체인 기반 시크릿 저장소 구현
export class KeychainSecretStore implements SecretStore {
  private getSecretKey(profile: string, key: string): string {
    const namespace =
      profile === SECRET_STORE.SHARED_PROFILE
        ? SECRET_STORE.NAMESPACE.SHARED
        : `${SECRET_STORE.NAMESPACE.PROFILE}.${profile}`;
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    return `${SECRET_STORE.NAMESPACE.ROOT}.${namespace}.${sanitizedKey}`;
  }

  private isProfileSecret(account: string, profile: string): boolean {
    const expectedPrefix =
      profile === SECRET_STORE.SHARED_PROFILE
        ? `${SECRET_STORE.NAMESPACE.ROOT}.${SECRET_STORE.NAMESPACE.SHARED}.`
        : `${SECRET_STORE.NAMESPACE.ROOT}.${SECRET_STORE.NAMESPACE.PROFILE}.${profile}.`;
    return account.startsWith(expectedPrefix);
  }

  async getSecret(profile: string, key: string): Promise<string | null> {
    return keytar.getPassword(
      SECRET_STORE.SERVICE_NAME,
      this.getSecretKey(profile, key)
    );
  }

  async setSecret(profile: string, key: string, value: string): Promise<void> {
    await keytar.setPassword(
      SECRET_STORE.SERVICE_NAME,
      this.getSecretKey(profile, key),
      value
    );
  }

  async removeSecret(profile: string, key: string): Promise<boolean> {
    return keytar.deletePassword(
      SECRET_STORE.SERVICE_NAME,
      this.getSecretKey(profile, key)
    );
  }

  async removeAllSecrets(profile: string): Promise<void> {
    const creds = await keytar.findCredentials(SECRET_STORE.SERVICE_NAME);
    await Promise.all(
      creds
        .filter((cred) => this.isProfileSecret(cred.account, profile))
        .map((cred) =>
          keytar.deletePassword(SECRET_STORE.SERVICE_NAME, cred.account)
        )
    );
  }
}

// 팩토리 함수
export const newKeychainSecretStore = (): SecretStore =>
  new KeychainSecretStore();
