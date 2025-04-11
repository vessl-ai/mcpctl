
type RegistryDef = {
  name: string;
  url: string;
  knownType: RegistryType;
}

enum RegistryType {
  GLAMA = "glama",
  SMITHERY = "smithery", 
}

// Base type for all registry entries
type RegistryEntry = {
  name: string;
  description: string;
  url: string;
  sourceUrl: string;
}


const defaultRegistryDefs: RegistryDef[] = [
  {
    name: "glama",
    url: "https://glama.ai/mcp/servers.data",
    knownType: RegistryType.GLAMA,
  },
  {
    name: "smithery",
    url: "https://smithery.io",
    knownType: RegistryType.SMITHERY,
  },
];

export { defaultRegistryDefs, RegistryDef, RegistryEntry, RegistryType };

