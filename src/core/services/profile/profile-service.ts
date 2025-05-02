import { ServerEnvConfig } from "../../lib/types/config";
import { Profile } from "../../lib/types/profile";
import { SecretReference } from "../../lib/types/secret";
import { ConfigService } from "../config/config-service";
import { SecretService } from "../secret/secret-service";
import { defaultProfile } from "./default-profile";
import { ProfileStore } from "./profile-store";

export interface ProfileService {
  setCurrentProfile: (name: string) => void;
  getCurrentProfile: () => Profile;
  getCurrentProfileName: () => string;
  getProfile: (name: string) => Profile | undefined;
  getProfileEnvForServer(
    name: string,
    serverName: string
  ): Promise<ServerEnvConfig>;
  upsertProfileEnvForServer(
    profileName: string,
    serverName: string,
    env: Record<string, string>
  ): Promise<void>;
  removeProfileEnvForServer(
    profileName: string,
    serverName: string,
    envList: string[]
  ): Promise<void>;
  upsertProfileSecretsForServer(
    profileName: string,
    serverName: string,
    secrets: Record<string, string>
  ): Promise<Record<string, SecretReference>>;
  removeProfileSecret(
    profileName: string,
    serverName: string,
    secretKey: string
  ): Promise<void>;
  updateProfile: (name: string, profile: Profile) => void;
  setServerEnvForProfile: (
    profileName: string,
    serverName: string,
    env: Record<string, string>
  ) => void;
  createProfile: (name: string) => void;
  deleteProfile: (name: string) => void;
  listProfiles: () => Profile[];
}

export class ProfileServiceImpl implements ProfileService {
  private currentProfile: Profile;
  private currentProfileName: string = "default";

  constructor(
    private readonly profileStore: ProfileStore,
    private readonly configService: ConfigService,
    private readonly secretService: SecretService
  ) {
    this.currentProfileName =
      this.configService.getConfig().profile.currentActiveProfile;
    if (this.profileStore.exists(this.currentProfileName)) {
      this.currentProfile = this.profileStore.loadProfile(
        this.currentProfileName
      );
    } else {
      this.currentProfile = defaultProfile;
    }
  }

  setCurrentProfile(name: string): void {
    if (!this.profileStore.exists(name)) {
      throw new Error(`Profile ${name} does not exist`);
    }
    this.currentProfileName = name;
    this.currentProfile = this.profileStore.loadProfile(name);
    this.configService.updateConfig({
      profile: {
        currentActiveProfile: this.currentProfileName,
        allProfiles: this.profileStore.listProfileNames(),
      },
    });
  }

  getCurrentProfile(): Profile {
    if (this.currentProfile) {
      return this.currentProfile;
    }
    return this.profileStore.loadProfile(this.currentProfileName);
  }

  getCurrentProfileName(): string {
    return this.currentProfileName;
  }

  updateProfile(name: string, profile: Profile): void {
    this.profileStore.saveProfile(name, profile);
    if (name === this.currentProfileName) {
      this.currentProfile = profile;
    }
    this.configService.updateConfig({
      profile: {
        currentActiveProfile: this.currentProfileName,
        allProfiles: this.profileStore.listProfileNames(),
      },
    });
  }

  setServerEnvForProfile(
    profileName: string,
    serverName: string,
    env: Record<string, string>
  ): void {
    const profile = this.getProfile(profileName);
    if (!profile) {
      throw new Error(`Profile ${profileName} does not exist`);
    }

    if (!profile.servers[serverName]) {
      profile.servers[serverName] = {
        env: {
          env: env,
          secrets: {},
        },
      };
    } else {
      profile.servers[serverName].env = {
        env: env,
        secrets: profile.servers[serverName].env?.secrets || {},
      };
    }

    this.updateProfile(profileName, profile);
  }

  getProfile(name: string): Profile | undefined {
    return this.profileStore.loadProfile(name);
  }

  createProfile(name: string): void {
    const profile = {
      ...defaultProfile,
      name,
    };
    this.updateProfile(name, profile);
  }

  listProfiles(): Profile[] {
    return this.profileStore.listProfiles();
  }

  deleteProfile(name: string): void {
    this.profileStore.deleteProfile(name);
    if (this.currentProfileName === name) {
      this.setCurrentProfile(this.profileStore.listProfileNames()[0]);
    }
    this.configService.updateConfig({
      profile: {
        currentActiveProfile: this.currentProfileName,
        allProfiles: this.profileStore.listProfileNames(),
      },
    });
  }

  async getProfileEnvForServer(
    name: string,
    serverName: string
  ): Promise<ServerEnvConfig> {
    const serverConfig = this.getProfile(name)?.servers[serverName];
    if (!serverConfig?.env) {
      return { env: {}, secrets: {} };
    }
    return {
      env: serverConfig.env.env || {},
      secrets: serverConfig.env.secrets || {},
    };
  }

  async upsertProfileEnvForServer(
    profileName: string,
    serverName: string,
    env: Record<string, string>
  ): Promise<void> {
    const profile = this.getProfile(profileName) || {
      name: profileName,
      servers: {},
    };

    // 프로필 업데이트
    if (!profile.servers[serverName]) {
      profile.servers[serverName] = {
        env: {
          env: env,
          secrets: {},
        },
      };
    } else {
      profile.servers[serverName].env = {
        env: {
          ...(profile.servers[serverName]?.env?.env || {}), // update는 기존 값을 유지한다
          ...env,
        },
        secrets: {
          ...(profile.servers[serverName]?.env?.secrets || {}),
        },
      };
    }

    this.updateProfile(profileName, profile);
  }

  async removeProfileEnvForServer(
    profileName: string,
    serverName: string,
    envList: string[]
  ): Promise<void> {
    const profile = this.getProfile(profileName);
    if (!profile?.servers[serverName]?.env?.env) return;

    const updatedEnv = { ...profile.servers[serverName].env.env };
    for (const key of envList) {
      delete updatedEnv[key];
    }

    profile.servers[serverName].env.env = updatedEnv;

    this.updateProfile(profileName, profile);
  }

  async upsertProfileSecretsForServer(
    profileName: string,
    serverName: string,
    secrets: Record<string, string>
  ): Promise<Record<string, SecretReference>> {
    const profile = this.getProfile(profileName) || {
      name: profileName,
      servers: {},
    };

    // const secretRefs: Record<string, SecretReference> = {};
    // await Promise.all(
    //   Object.entries(secrets).map(async ([key, value]) => {
    //     const secretKey = normalizeSecretKey(key);
    //     await this.secretService.setProfileSecret(
    //       profileName,
    //       secretKey,
    //       value
    //     );
    //     secretRefs[key] = { key: secretKey };
    //   })
    // );

    // if (!profile.servers[serverName]) {
    //   profile.servers[serverName] = {
    //     env: {
    //       env: {},
    //       secrets: secretRefs,
    //     },
    //   };
    // } else {
    //   profile.servers[serverName].env = {
    //     env: {
    //       ...(profile.servers[serverName]?.env?.env || {}),
    //     },
    //     secrets: {
    //       ...(profile.servers[serverName]?.env?.secrets || {}), // 이건 이미 암호화 되어있으므로, 기존 값은
    //       ...secretRefs,
    //     },
    //   };
    // }

    // this.updateProfile(profileName, profile);
    // return secretRefs;
    throw new Error("Not implemented");
  }

  async removeProfileSecret(
    profileName: string,
    serverName: string,
    secretKey: string
  ): Promise<void> {
    // const profile = this.getProfile(profileName);
    // if (!profile?.servers[serverName]?.env?.secrets) return;

    // // SecretStore에서 시크릿 삭제
    // await this.secretService.removeProfileSecret(profileName, secretKey);

    // // 프로필에서 시크릿 참조 삭제
    // const { [secretKey]: _, ...remainingSecrets } =
    //   profile.servers[serverName].env.secrets;
    // profile.servers[serverName].env.secrets = remainingSecrets;

    // this.updateProfile(profileName, profile);

    throw new Error("Not implemented");
  }
}

export const newProfileService = (
  profileStore: ProfileStore,
  configService: ConfigService,
  secretService: SecretService
): ProfileService => {
  return new ProfileServiceImpl(profileStore, configService, secretService);
};
