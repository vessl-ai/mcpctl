import { RegistryDef } from "../../lib/types/registry";
import { ConfigService } from "../config/config-service";

export interface RegistryDefStore {
  getRegistryDef: (name: string) => RegistryDef;
  addRegistryDef: (registry: RegistryDef) => void;
  listRegistryDefs: () => RegistryDef[];
  deleteRegistryDef: (name: string) => void;
}

export class ConfigRegistryDefStore implements RegistryDefStore {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  getRegistryDef(name: string): RegistryDef {
    const registrySection = this.configService.getConfigSection("registry");
    const registry = registrySection.registries.find((r) => r.name === name);
    if (!registry) {
      throw new Error(`Registry ${name} not found`);
    }
    return registry;
  }

  addRegistryDef(registry: RegistryDef): void {
    const registrySection = this.configService.getConfigSection("registry");
    registrySection.registries.push(registry);
    this.configService.saveConfig();
  }

  listRegistryDefs(): RegistryDef[] {
    const registrySection = this.configService.getConfigSection("registry");
    return registrySection.registries;
  }

  deleteRegistryDef(name: string): void {
    const registrySection = this.configService.getConfigSection("registry");
    registrySection.registries = registrySection.registries.filter(
      (r) => r.name !== name
    );
    this.configService.saveConfig();
  }
}

export const newConfigRegistryDefStore = (
  configService: ConfigService
): RegistryDefStore => {
  return new ConfigRegistryDefStore(configService);
};
