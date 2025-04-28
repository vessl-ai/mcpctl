import fs from "fs";
import path from "path";
import { getProfileDir } from "../../lib/env";
import { Profile } from "../../lib/types/profile";
import { defaultProfile } from "./default-profile";

export interface ProfileStore {
  exists: (name: string) => boolean;
  loadProfile: (name: string) => Profile;
  saveProfile: (name: string, profile: Profile) => void;
  listProfileNames: () => string[];
  listProfiles: () => Profile[];
  deleteProfile: (name: string) => void;
}

export class ProfileStoreImpl implements ProfileStore {
  constructor(private readonly profileDir: string = getProfileDir()) {
    if (!fs.existsSync(this.profileDir)) {
      fs.mkdirSync(this.profileDir, { recursive: true });
    }
    const defaultProfilePath = path.join(this.profileDir, "default.json");
    if (!fs.existsSync(defaultProfilePath)) {
      fs.writeFileSync(
        defaultProfilePath,
        JSON.stringify(defaultProfile, null, 2)
      );
    }
  }

  private getProfilePath(name: string): string {
    const fileName = `${name}.json`;
    return path.join(this.profileDir, fileName);
  }

  exists(name: string): boolean {
    return fs.existsSync(this.getProfilePath(name));
  }

  loadProfile(name: string): Profile {
    return JSON.parse(fs.readFileSync(this.getProfilePath(name), "utf8"));
  }

  saveProfile(name: string, profile: Profile): void {
    fs.writeFileSync(
      this.getProfilePath(name),
      JSON.stringify(profile, null, 2)
    );
  }

  listProfileNames(): string[] {
    return fs.readdirSync(this.profileDir).map((name) => name.split(".")[0]);
  }

  listProfiles(): Profile[] {
    return this.listProfileNames().map((name) => this.loadProfile(name));
  }

  deleteProfile(name: string): void {
    fs.unlinkSync(this.getProfilePath(name));
  }
}

export const newFileProfileStore = (): ProfileStore => {
  return new ProfileStoreImpl();
};
