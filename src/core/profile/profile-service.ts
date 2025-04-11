import { getProfileName } from "../lib/env";
import { defaultProfile, Profile } from "./profile";
import { ProfileStore } from "./profile-store";
interface ProfileService {
  setCurrentProfile: (name: string) => void;
  getCurrentProfile: () => Profile;
  updateCurrentProfile: (profile: Profile) => void;
}

class ProfileServiceImpl implements ProfileService {
  private profileStore: ProfileStore;
  private currentProfile: Profile;
  private currentProfileName: string;

  constructor(profileStore: ProfileStore) {
    this.profileStore = profileStore;
    this.currentProfileName = getProfileName();
    if (this.profileStore.exists(this.currentProfileName)) {
      this.currentProfile = this.profileStore.loadProfile(this.currentProfileName);
    } else {
      this.currentProfile = defaultProfile
    }
  }

  setCurrentProfile(name: string): void {
    if (!this.profileStore.exists(name)) {
      throw new Error(`Profile ${name} does not exist`);
    }
    this.currentProfileName = name;
    this.currentProfile = this.profileStore.loadProfile(name);
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
  }
}

const newProfileService = (profileStore: ProfileStore): ProfileService => {
  return new ProfileServiceImpl(profileStore);
}

export {
  newProfileService, ProfileService,
  ProfileServiceImpl
};

