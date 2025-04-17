import { Profile } from "../../lib/types/profile";
import { ConfigService } from "../config/config-service";
import { defaultProfile } from "./default-profile";
import { ProfileStore } from "./profile-store";
interface ProfileService {
  setCurrentProfile: (name: string) => void;
  getCurrentProfile: () => Profile;
  updateCurrentProfile: (profile: Profile) => void;
  setServerEnvForProfile: (
    profileName: string,
    serverName: string,
    env: Record<string, string>
  ) => void;
  getProfile: (name: string) => Profile;
  createProfile: (name: string) => void;
  deleteProfile: (name: string) => void;
  listProfiles: () => Profile[];
  getProfileEnvForServer: (
    name: string,
    serverName: string
  ) => Record<string, string>;
  updateProfileEnvForServer: (
    profileName: string,
    serverName: string,
    env: Record<string, string>
  ) => void;
}

class ProfileServiceImpl implements ProfileService {
  private currentProfile: Profile;
  private currentProfileName: string = "default";

  constructor(
    private readonly profileStore: ProfileStore,
    private readonly configService: ConfigService
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

  updateCurrentProfile(profile: Profile): void {
    this.currentProfile = profile;
    this.profileStore.saveProfile(this.currentProfileName, profile);
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
    profile.servers[serverName].env = env;
    this.updateCurrentProfile(profile);
  }

  getProfile(name: string): Profile {
    return this.profileStore.loadProfile(name);
  }

  createProfile(name: string): void {
    const profile = {
      ...defaultProfile,
      name,
    };
    this.profileStore.saveProfile(name, profile);
    this.configService.updateConfig({
      profile: {
        currentActiveProfile: this.currentProfileName,
        allProfiles: this.profileStore.listProfileNames(),
      },
    });
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

  getProfileEnvForServer(
    name: string,
    serverName: string
  ): Record<string, string> {
    return this.getProfile(name)?.servers[serverName]?.env ?? {};
  }

  updateProfileEnvForServer(
    profileName: string,
    serverName: string,
    env: Record<string, string>
  ): void {
    const profile = this.getProfile(profileName);
    if (!profile) {
      this.updateCurrentProfile({
        name: profileName,
        servers: {
          [serverName]: {
            env: env,
          },
        },
      });
    } else if (!profile.servers[serverName]) {
      profile.servers[serverName] = {
        env: env,
      };
    } else if (!profile.servers[serverName].env) {
      profile.servers[serverName].env = env;
    } else {
      profile.servers[serverName].env = {
        ...(profile?.servers[serverName]?.env ?? {}),
        ...env,
      };
    }
    this.updateCurrentProfile(profile);
  }
}

const newProfileService = (
  profileStore: ProfileStore,
  configService: ConfigService
): ProfileService => {
  return new ProfileServiceImpl(profileStore, configService);
};

export {
  defaultProfile,
  newProfileService,
  ProfileService,
  ProfileServiceImpl,
};
