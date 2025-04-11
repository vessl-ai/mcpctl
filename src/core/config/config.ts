import { defaultProfileConfig, ProfileConfig } from "./profile";
import { defaultRegistryConfig, RegistryConfig } from "./registry";

type Config = {
  // Profile
  profile: ProfileConfig;

  // Registry
  registry: RegistryConfig;
}


const defaultConfig: Config = {
  profile: defaultProfileConfig,
  registry: defaultRegistryConfig,
}

export {
  Config,
  defaultConfig
};

