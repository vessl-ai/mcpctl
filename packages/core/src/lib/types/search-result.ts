import { RegistryEntry } from "./registry";

export type SearchResult = {
  entries: SearchResultEntry[];
};

export type SearchResultEntry = {
  registry: string;
  name: string;
  description: string;
  url: string;
  sourceUrl: string;
  entry: RegistryEntry;
};
