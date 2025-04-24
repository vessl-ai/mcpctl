import { RegistryEntry } from './registry';
type SearchResult = {
  entries: SearchResultEntry[];
};

type SearchResultEntry = {
  registry: string;
  name: string;
  description: string;
  url: string;
  sourceUrl: string;
  entry: RegistryEntry;
};

export { SearchResult, SearchResultEntry };
