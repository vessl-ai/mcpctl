export { GlamaRegistryEntry, GlamaRegistryProvider } from "./glama";
export { SmitheryRegistryEntry, SmitheryRegistryProvider } from "./smithery";

import {
  RegistryDef,
  RegistryEntry,
  RegistryType,
} from "../../../lib/types/registry";
import { GlamaRegistryProvider } from "./glama";
import { SmitheryRegistryProvider } from "./smithery";

interface RegistryProvider {
  findEntryByName(name: string, limit?: number): Promise<RegistryEntry>;
  findEntriesByQuery(query: string, limit?: number): Promise<RegistryEntry[]>;
  findEntriesBySemanticQuery(
    query: string,
    limit?: number
  ): Promise<RegistryEntry[]>;
}

interface RegistryProviderFactory {
  createOrGetRegistryProvider(registryDef: RegistryDef): RegistryProvider;
}

class RegistryProviderFactoryImpl implements RegistryProviderFactory {
  private registryProviders: Map<string, RegistryProvider> = new Map();

  createOrGetRegistryProvider(registryDef: RegistryDef): RegistryProvider {
    if (!this.registryProviders.has(registryDef.knownType)) {
      switch (registryDef.knownType) {
        case RegistryType.GLAMA:
          this.registryProviders.set(
            registryDef.knownType,
            new GlamaRegistryProvider()
          );
          break;
        case RegistryType.SMITHERY:
          this.registryProviders.set(
            registryDef.knownType,
            new SmitheryRegistryProvider()
          );
          break;
        default:
          throw new Error(`Unknown registry type: ${registryDef.knownType}`);
      }
    }
    return this.registryProviders.get(
      registryDef.knownType
    ) as RegistryProvider;
  }
}

const newRegistryProviderFactory = (): RegistryProviderFactory => {
  return new RegistryProviderFactoryImpl();
};

export {
  newRegistryProviderFactory,
  RegistryProvider,
  RegistryProviderFactory,
};
