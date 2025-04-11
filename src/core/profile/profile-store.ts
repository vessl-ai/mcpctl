import fs from "fs";
import path from "path";
import { getProfileDir } from "../lib/env";
import { Profile } from "./profile";
interface ProfileStore {
  exists: (name: string) => boolean;
  loadProfile: (name: string) => Profile;
  saveProfile: (name: string, profile: Profile) => void;
  listProfileNames: () => string[];
}


class ProfileStoreImpl implements ProfileStore {

  constructor(
    private readonly profileDir: string = getProfileDir()
  ) {

  }

  private getProfilePath(name: string): string {
    const fileName = `${name}.json`;
    return path.join(this.profileDir, fileName);
  }

  exists(name: string): boolean {
    return fs.existsSync(this.getProfilePath(name));
  }

  loadProfile(name: string): Profile {
    return JSON.parse(fs.readFileSync(this.getProfilePath(name), 'utf8'));
  }

  saveProfile(name: string, profile: Profile): void {
    fs.writeFileSync(this.getProfilePath(name), JSON.stringify(profile, null, 2));
  }

  listProfileNames(): string[] {
    return fs.readdirSync(this.profileDir).map(name => name.split('.')[0]);
  }
} 

export {
  ProfileStore,
  ProfileStoreImpl
};
