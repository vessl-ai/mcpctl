import { RegistryProvider, RegistryProviderFactory } from "./providers";
import { RegistryDef } from "./registry";
import { RegistryDefStore } from "./registry-def-store";
interface RegistryService {
  getRegistryDef: (name: string) => RegistryDef;
  addRegistryDef: (registry: RegistryDef) => void;
  listRegistryDefs: () => RegistryDef[];
  getRegistryProvider: (name: string) => RegistryProvider;
};


class RegistryServiceImpl implements RegistryService {

  constructor(
    private readonly registryDefStore: RegistryDefStore, 
    private readonly registryProviderFactory: RegistryProviderFactory
  ) {
  }

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
    return this.registryProviderFactory.createOrGetRegistryProvider(registryDef);
  }
}

const newRegistryService = (registryDefStore: RegistryDefStore, registryProviderFactory: RegistryProviderFactory): RegistryService => {
  return new RegistryServiceImpl(registryDefStore, registryProviderFactory);
}

export {
  newRegistryService, RegistryService,
  RegistryServiceImpl
};

