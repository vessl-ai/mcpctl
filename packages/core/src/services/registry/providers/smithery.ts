import { RegistryEntry } from "../../../lib/types/registry";
import { RegistryProvider } from "./provider";

export type SmitheryRegistryEntry = RegistryEntry & {};

export class SmitheryRegistryProvider implements RegistryProvider {
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
