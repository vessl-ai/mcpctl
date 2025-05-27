// Type for environment variables in a profile
export type ProfileEnv = Record<string, string>;

// Type for a single profile
export interface Profile {
  description?: string;
  env: ProfileEnv;
}

// Type for all profiles (profile name -> profile)
export type ProfileMap = Record<string, Profile>;
