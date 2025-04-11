import { RegistryService } from "../registry/registry-service";
import { SearchResult, buildSearchResult, searchResultEntryFromRegistryEntry } from "./search-result";

interface SearchService {
  // Search for a specific entry by registry and name, when you know the exact name
  searchByRegistryAndName(registry: string, name: string): Promise<SearchResult>;

  // Search for a query in a specific registry
  searchByQueryForRegistry(registry: string, query: string): Promise<SearchResult>;
  
  // Search for a query in a specific registry
  searchBySemanticQueryForRegistry(registry: string, query: string): Promise<SearchResult>;

  // Search for a query in all registries
  searchByQuery(query: string): Promise<SearchResult>;
  
  // Search for a query in all registries
  searchBySemanticQuery(query: string): Promise<SearchResult>;
}


class SearchServiceImpl implements SearchService {
  constructor(private readonly registryService: RegistryService) {}

  async searchByRegistryAndName(
    registryName: string,
    name: string
  ): Promise<SearchResult> {
    const registryProvider = this.registryService.getRegistryProvider(registryName);
    const entry = await registryProvider.findEntryByName(name);
    return buildSearchResult([searchResultEntryFromRegistryEntry(registryName, entry)]);
  }
  async searchByQueryForRegistry(
    registry: string,
    query: string
  ): Promise<SearchResult> {
    const registryProvider = this.registryService.getRegistryProvider(registry);
    const entries = await registryProvider.findEntriesByQuery(query);
    return buildSearchResult(entries.map((entry) => searchResultEntryFromRegistryEntry(registry, entry)));
  }
  async searchBySemanticQueryForRegistry(
    registry: string,
    query: string
  ): Promise<SearchResult> {
    const registryProvider = this.registryService.getRegistryProvider(registry);
    const entries = await registryProvider.findEntriesBySemanticQuery(query);
    return buildSearchResult(entries.map((entry) => searchResultEntryFromRegistryEntry(registry, entry)));
  }
  async searchByQuery(query: string): Promise<SearchResult> {
    const registries = this.registryService.listRegistryDefs();
    const entries = await Promise.all(registries.map((registry) => this.searchByQueryForRegistry(registry.name, query)));
    return buildSearchResult(entries.flatMap((entry) => entry.entries));
  }
  async searchBySemanticQuery(query: string): Promise<SearchResult> {
    const registries = this.registryService.listRegistryDefs();
    const entries = await Promise.all(registries.map((registry) => this.searchBySemanticQueryForRegistry(registry.name, query)));
    return buildSearchResult(entries.flatMap((entry) => entry.entries));
  }
}

const newSearchService = (registryService: RegistryService): SearchService => {
  return new SearchServiceImpl(registryService);
}


export {
  SearchService,
  SearchServiceImpl, newSearchService
};

