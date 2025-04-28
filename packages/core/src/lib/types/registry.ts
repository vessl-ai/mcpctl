import { McpServerHostingType } from "@mcpctl/lib";

export type RegistryDef = {
  name: string;
  url: string;
  knownType: RegistryType;
};

export enum RegistryType {
  GLAMA = "glama",
  SMITHERY = "smithery",
  GITHUB = "github",
  CUSTOM = "custom",
}

// Base type for all registry entries
export type RegistryEntry = {
  name: string;
  description: string;
  url: string;
  sourceUrl: string;
  hosting: McpServerHostingType;
  attributes: string[];
};
