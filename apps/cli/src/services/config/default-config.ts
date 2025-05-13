import {
  Config,
  ProfileConfig,
  RegistryConfig,
} from "@vessl-ai/mcpctl-core/types";
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
