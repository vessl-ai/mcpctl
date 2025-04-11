import { defaultRegistryDefs, RegistryDef } from "../registry/registry";

type RegistryConfig = {
  // Registry config
  registries: RegistryDef[];
  
}


const defaultRegistryConfig: RegistryConfig = {
  // Registry config
  registries: defaultRegistryDefs
}

export {
  defaultRegistryConfig, RegistryConfig
};
