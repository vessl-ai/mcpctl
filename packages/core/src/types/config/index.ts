import { RegistryDef } from "../registry";
import { SecretReference, SharedSecretsConfig } from "../secret";
import { McpServerType } from "../server/mcp-server";

export type Config = {
  // Profile
  profile: ProfileConfig;

  // Registry
  registry: RegistryConfig;

  // Shared Secrets
  secrets: SharedSecretsConfig;

  // Shared Environment Variables
  sharedEnv?: Record<string, string>;
};

export type ProfileConfig = {
  // Profile config
  // ...
  currentActiveProfile: string;
  allProfiles: string[];
};

export interface ServerEnvConfig {
  env?: Record<string, string>;
  shared_env?: Record<string, string>;
  secrets?: Record<string, SecretReference>;
}

export type RegistryConfig = {
  // Registry config
  registries: RegistryDef[];
};

export type ServerConfig = {
  type?: McpServerType;
  command?: string;
  args?: string[];
  env?: {
    env: Record<string, string>;
    secrets: Record<string, { key: string }>;
  };
};
