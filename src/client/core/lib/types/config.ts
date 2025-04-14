import { RegistryDef } from "./registry";

type Config = {
  // Profile
  profile: ProfileConfig;

  // Registry
  registry: RegistryConfig;
}
type ProfileConfig = {
  // Profile config
  // ...
  currentActiveProfile: string;
  allProfiles: string[];
};
type RegistryConfig = {
  // Registry config
  registries: RegistryDef[];
};


export {
  Config,
  ProfileConfig,
  RegistryConfig
};

