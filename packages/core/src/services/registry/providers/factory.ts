import { RegistryDef, RegistryType } from "../../../lib/types/registry";
import { GlamaRegistryProvider } from "./glama";
import { RegistryProvider } from "./provider";
import { SmitheryRegistryProvider } from "./smithery";

export interface RegistryProviderFactory {
  createOrGetRegistryProvider(registryDef: RegistryDef): RegistryProvider;
}

export class RegistryProviderFactoryImpl implements RegistryProviderFactory {
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

export const newRegistryProviderFactory = (): RegistryProviderFactory => {
  return new RegistryProviderFactoryImpl();
};
