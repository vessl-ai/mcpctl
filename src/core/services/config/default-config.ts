import { Config, ProfileConfig, RegistryConfig } from "../../lib/types/config";
import { defaultRegistryDefs } from "../registry/default-registry-defs";

const defaultProfileConfig: ProfileConfig = {
  // Profile config
  // ...
  currentActiveProfile: "default",
  allProfiles: ["default"],
};

const defaultRegistryConfig: RegistryConfig = {
  // Registry config
  registries: defaultRegistryDefs,
};

export const defaultConfig: Config = {
  profile: defaultProfileConfig,
  registry: defaultRegistryConfig,
  secrets: {
    shared: {},
  },
  sharedEnv: {},
};
