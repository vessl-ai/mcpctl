import { RegistryDef } from "../../lib/types/registry";
import { RegistryProvider, RegistryProviderFactory } from "./providers";
import { RegistryDefStore } from "./registry-def-store";
export interface RegistryService {
  getRegistryDef: (name: string) => RegistryDef;
  addRegistryDef: (registry: RegistryDef) => void;
  listRegistryDefs: () => RegistryDef[];
  deleteRegistryDef: (name: string) => void;
  getRegistryProvider: (name: string) => RegistryProvider;
}

export class RegistryServiceImpl implements RegistryService {
  constructor(
    private readonly registryDefStore: RegistryDefStore,
    private readonly registryProviderFactory: RegistryProviderFactory
  ) {}

  getRegistryDef(name: string): RegistryDef {
    return this.registryDefStore.getRegistryDef(name);
  }

  addRegistryDef(registry: RegistryDef): void {
    this.registryDefStore.addRegistryDef(registry);
  }

  listRegistryDefs(): RegistryDef[] {
    return this.registryDefStore.listRegistryDefs();
  }

  getRegistryProvider(name: string): RegistryProvider {
    const registryDef = this.getRegistryDef(name);
    return this.registryProviderFactory.createOrGetRegistryProvider(
      registryDef
    );
  }

  deleteRegistryDef(name: string): void {
    this.registryDefStore.deleteRegistryDef(name);
  }
}

export const newRegistryService = (
  registryDefStore: RegistryDefStore,
  registryProviderFactory: RegistryProviderFactory
): RegistryService => {
  return new RegistryServiceImpl(registryDefStore, registryProviderFactory);
};
