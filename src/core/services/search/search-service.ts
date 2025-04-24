import { RegistryEntry } from '../../lib/types/registry';
import { SearchResult, SearchResultEntry } from '../../lib/types/search-result';
import { RegistryService } from '../registry/registry-service';

interface SearchService {
  // Search for a specific entry by registry and name, when you know the exact name
  searchByRegistryAndName(registry: string, name: string, limit?: number): Promise<SearchResult>;

  // Search for a query in a specific registry
  searchByQueryForRegistry(registry: string, query: string, limit?: number): Promise<SearchResult>;

  // Search for a query in a specific registry
  searchBySemanticQueryForRegistry(registry: string, query: string, limit?: number): Promise<SearchResult>;

  // Search for a query in all registries
  searchByQuery(query: string, limit?: number): Promise<SearchResult>;

  // Search for a query in all registries
  searchBySemanticQuery(query: string, limit?: number): Promise<SearchResult>;

  buildSearchResult(entries: SearchResultEntry[]): SearchResult;

  searchResultEntryFromRegistryEntry(registry: string, entry: RegistryEntry): SearchResultEntry;
}

class SearchServiceImpl implements SearchService {
  constructor(private readonly registryService: RegistryService) {}

  async searchByRegistryAndName(registryName: string, name: string, limit?: number): Promise<SearchResult> {
    const registryProvider = this.registryService.getRegistryProvider(registryName);
    const entry = await registryProvider.findEntryByName(name, limit);
    return this.buildSearchResult([this.searchResultEntryFromRegistryEntry(registryName, entry)]);
  }
  async searchByQueryForRegistry(registry: string, query: string, limit?: number): Promise<SearchResult> {
    const registryProvider = this.registryService.getRegistryProvider(registry);
    const entries = await registryProvider.findEntriesByQuery(query, limit);
    return this.buildSearchResult(entries.map(entry => this.searchResultEntryFromRegistryEntry(registry, entry)));
  }
  async searchBySemanticQueryForRegistry(registry: string, query: string, limit?: number): Promise<SearchResult> {
    const registryProvider = this.registryService.getRegistryProvider(registry);
    const entries = await registryProvider.findEntriesBySemanticQuery(query, limit);
    return this.buildSearchResult(entries.map(entry => this.searchResultEntryFromRegistryEntry(registry, entry)));
  }
  async searchByQuery(query: string, limit?: number): Promise<SearchResult> {
    const registries = this.registryService.listRegistryDefs();
    const entries = await Promise.all(
      registries.map(registry => this.searchByQueryForRegistry(registry.name, query, limit))
    );
    return this.buildSearchResult(entries.flatMap(entry => entry.entries));
  }
  async searchBySemanticQuery(query: string, limit?: number): Promise<SearchResult> {
    const registries = this.registryService.listRegistryDefs();
    const entries = await Promise.all(
      registries.map(registry => this.searchBySemanticQueryForRegistry(registry.name, query, limit))
    );
    return this.buildSearchResult(entries.flatMap(entry => entry.entries));
  }

  buildSearchResult = (entries: SearchResultEntry[]): SearchResult => {
    return {
      entries,
    };
  };

  searchResultEntryFromRegistryEntry = (registry: string, entry: RegistryEntry): SearchResultEntry => {
    return {
      registry: registry,
      name: entry.name,
      description: entry.description,
      url: entry.url,
      sourceUrl: entry.sourceUrl,
      entry,
    };
  };
}

const newSearchService = (registryService: RegistryService): SearchService => {
  return new SearchServiceImpl(registryService);
};

export { newSearchService, SearchService, SearchServiceImpl };
