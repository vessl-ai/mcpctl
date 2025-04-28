import { RegistryEntry } from "../../../lib/types/registry";

export interface RegistryProvider {
  findEntryByName(name: string, limit?: number): Promise<RegistryEntry>;
  findEntriesByQuery(query: string, limit?: number): Promise<RegistryEntry[]>;
  findEntriesBySemanticQuery(
    query: string,
    limit?: number
  ): Promise<RegistryEntry[]>;
}
