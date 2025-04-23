import { RegistryEntry } from "../../../lib/types/registry";
import { RegistryProvider } from "./index";

type SmitheryRegistryEntry = RegistryEntry & {};

class SmitheryRegistryProvider implements RegistryProvider {
  findEntriesByQuery(query: string, limit?: number): Promise<RegistryEntry[]> {
    throw new Error("Method not implemented.");
  }
  findEntriesBySemanticQuery(
    query: string,
    limit?: number
  ): Promise<RegistryEntry[]> {
    throw new Error("Method not implemented.");
  }
  findEntryByName(name: string, limit?: number): Promise<RegistryEntry> {
    throw new Error("Method not implemented.");
  }
}

export { SmitheryRegistryEntry, SmitheryRegistryProvider };
