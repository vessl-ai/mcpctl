import { RegistryEntry } from "../registry";
import { RegistryProvider } from "./index";

type GlamaRegistryEntry = RegistryEntry & {};

class GlamaRegistryProvider implements RegistryProvider {
  findEntriesByQuery(query: string): Promise<RegistryEntry[]> {
    throw new Error("Method not implemented.");
  }
  findEntriesBySemanticQuery(query: string): Promise<RegistryEntry[]> {
    throw new Error("Method not implemented.");
  }
  findEntryByName(name: string): Promise<RegistryEntry> {
    throw new Error("Method not implemented.");
  }
}

export { GlamaRegistryEntry, GlamaRegistryProvider };
