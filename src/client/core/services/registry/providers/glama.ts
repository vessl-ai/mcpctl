import axios from "axios";
import { RegistryEntry } from "../../lib/types/registry";
import { RegistryProvider } from "./index";

interface GlamaMcpServer {
  id: string;
  name: string;
  description: string;
  url: string;
  attributes: string[];
  repository?: {
    url: string;
  };
  spdxLicense?: {
    name: string;
    url: string;
  };
}

interface GlamaSearchResponse {
  pageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
  };
  servers: GlamaMcpServer[];
}

type GlamaRegistryEntry = RegistryEntry & {
};

class GlamaRegistryProvider implements RegistryProvider {
  private readonly ENDPOINT = "https://glama.ai/api/mcp/v1/servers";

  async findEntriesByQuery(query: string): Promise<RegistryEntry[]> {
    try {
      const response = await axios.get<GlamaSearchResponse>(this.ENDPOINT, {
        params: {
          query,
          first: 100 // Maximum allowed by API
        }
      });

      return response.data.servers.map(server => ({
        name: server.name,
        description: server.description,
        url: server.url,
        sourceUrl: server.repository?.url || server.url, // Use repository URL if available, fallback to server URL
        repository: server.repository?.url,
        license: server.spdxLicense?.name,
        attributes: server.attributes,
        hosting: server.attributes.includes('hosting:remote-capable') ? 'remote' : 'local'
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch from Glama API: ${error.message}`);
      }
      throw error;
    }
  }

  async findEntriesBySemanticQuery(query: string): Promise<RegistryEntry[]> {
    throw new Error("Semantic search not supported by Glama API");
  }

  async findEntryByName(name: string): Promise<RegistryEntry> {
    const entries = await this.findEntriesByQuery(name);
    const exactMatch = entries.find(entry => entry.name === name);
    
    if (!exactMatch) {
      throw new Error(`No entry found with name: ${name}`);
    }

    return exactMatch;
  }
}

export { GlamaRegistryEntry, GlamaRegistryProvider };
