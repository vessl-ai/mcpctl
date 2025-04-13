

import { ClientService, newClientService } from '../core/client/client-service';
import { ConfigService, newConfigService } from '../core/config/config-service';
import { ConfigStore, newFileConfigStore } from '../core/config/config-store';
import { verboseLog } from '../core/lib/env';
import { Logger, newConsoleLogger } from '../core/lib/logger';
import { ProfileService, newProfileService } from '../core/profile/profile-service';
import { ProfileStore, newFileProfileStore } from '../core/profile/profile-store';
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
    this.container.register<ConfigStore>("configStore", newFileConfigStore());
    this.container.register<ConfigService>(
      "configService",
      newConfigService(this.container.get<ConfigStore>("configStore"))
    );

    // Register RegistryService
    this.container.register<RegistryDefStore>(
      "registryDefStore",
      newConfigRegistryDefStore(
        this.container.get<ConfigService>("configService")
      )
    );
    this.container.register<RegistryProviderFactory>(
      "registryProviderFactory",
      newRegistryProviderFactory()
    );
    this.container.register<RegistryService>(
      "registryService",
      newRegistryService(
        this.container.get<RegistryDefStore>("registryDefStore"),
        this.container.get<RegistryProviderFactory>("registryProviderFactory")
      )
    );

    // Register SearchService
    this.container.register<SearchService>(
      "searchService",
      newSearchService(this.container.get<RegistryService>("registryService"))
    );

    // Register ClientService
    this.container.register<ClientService>(
      "clientService",
      newClientService()
    );

    // Register ProfileService
    this.container.register<ProfileStore>(
      "profileStore",
      newFileProfileStore()
    );
    this.container.register<ProfileService>(
      "profileService",
      newProfileService(
        this.container.get<ProfileStore>("profileStore"),
        this.container.get<ConfigService>("configService")
      )
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

  public getClientService(): ClientService {
    return this.container.get<ClientService>("clientService");
  }

  public getProfileService(): ProfileService {
    return this.container.get<ProfileService>("profileService");
  }
}

const newApp = (): App => {
  return new App();
};

export {
  App,
  newApp
};
