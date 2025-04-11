

import { ConfigService, newConfigService } from '../core/config/config-service';
import { ConfigStore, newFileConfigStore } from '../core/config/config-store';
import { verboseLog } from '../core/lib/env';
import { Logger, newConsoleLogger } from '../core/lib/logger';
import { RegistryProviderFactory, newRegistryProviderFactory } from '../core/registry/providers';
import { RegistryDefStore, newConfigRegistryDefStore } from '../core/registry/registry-def-store';
import { RegistryService, newRegistryService } from '../core/registry/registry-service';
import { SearchService, newSearchService } from '../core/search/search-service';
import { BaseContainer, Container } from '../lib/container/container';

class App {
  private container: Container;

  constructor() {
    this.container = new BaseContainer();
    this.initializeDependencies();
  }

  private initializeDependencies(): void {
    // Register core dependencies
    this.container.register<Logger>("Logger", newConsoleLogger({showVerbose: verboseLog()}));

    // Register ConfigService
    this.container.register<ConfigStore>("ConfigStore", newFileConfigStore());
    this.container.register<ConfigService>(
      "ConfigService",
      newConfigService(this.container.get<ConfigStore>("ConfigStore"))
    );

    // Register RegistryService
    this.container.register<RegistryDefStore>(
      "RegistryDefStore",
      newConfigRegistryDefStore(
        this.container.get<ConfigService>("ConfigService")
      )
    );
    this.container.register<RegistryProviderFactory>(
      "RegistryProviderFactory",
      newRegistryProviderFactory()
    );
    this.container.register<RegistryService>(
      "registryService",
      newRegistryService(
        this.container.get<RegistryDefStore>("RegistryDefStore"),
        this.container.get<RegistryProviderFactory>("RegistryProviderFactory")
      )
    );

    // Register SearchService
    this.container.register<SearchService>(
      "searchService",
      newSearchService(this.container.get<RegistryService>("registryService"))
    );
  }

  public getConfigService(): ConfigService {
    return this.container.get<ConfigService>("configService");
  }

  public getRegistryService(): RegistryService {
    return this.container.get<RegistryService>("registryService");
  }
  public getSearchService(): SearchService {
    return this.container.get<SearchService>("searchService");
  }
}

const newApp = (): App => {
  return new App();
};

export {
  App,
  newApp
};
