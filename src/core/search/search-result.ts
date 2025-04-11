import { RegistryEntry } from "../registry/registry";
type SearchResult = {
  entries: SearchResultEntry[];
}

type SearchResultEntry = {
  registry: string;
  name: string;
  description: string;
  url: string;
  sourceUrl: string;
  entry: RegistryEntry;
}

const buildSearchResult = (entries: SearchResultEntry[]): SearchResult => {
  return {
    entries
  };
}

const searchResultEntryFromRegistryEntry = (registry: string, entry: RegistryEntry): SearchResultEntry => {
  return {
    registry: registry,
    name: entry.name,
    description: entry.description,
    url: entry.url,
    sourceUrl: entry.sourceUrl,
    entry
  };
}


export {
  buildSearchResult, SearchResult,
  SearchResultEntry,
  searchResultEntryFromRegistryEntry
};

