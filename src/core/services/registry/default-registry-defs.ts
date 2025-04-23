import { RegistryType } from "../../lib/types/registry";

import { RegistryDef } from "../../lib/types/registry";

const defaultRegistryDefs: RegistryDef[] = [
  {
    name: "glama",
    url: "https://glama.ai/mcp/servers.data",
    knownType: RegistryType.GLAMA,
  },
  // {
  //   name: "smithery",
  //   url: "https://smithery.io",
  //   knownType: RegistryType.SMITHERY,
  // },
];

export { defaultRegistryDefs };
