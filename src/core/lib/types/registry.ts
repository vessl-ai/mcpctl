import { McpServerHostingType } from "../../../lib/types/hosting";
type RegistryDef = {
  name: string;
  url: string;
  knownType: RegistryType;
};

enum RegistryType {
  GLAMA = "glama",
  SMITHERY = "smithery",
  GITHUB = "github",
  CUSTOM = "custom",
}

// Base type for all registry entries
type RegistryEntry = {
  name: string;
  description: string;
  url: string;
  sourceUrl: string;
  hosting: McpServerHostingType;
  attributes: string[];
};

export { RegistryDef, RegistryEntry, RegistryType };
