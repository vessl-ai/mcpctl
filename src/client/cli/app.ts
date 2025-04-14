

import { BaseContainer, Container } from '../../lib/container/container';
import { Logger, newConsoleLogger } from '../../lib/logger/logger';
import { verboseLog } from '../core/lib/env';
import { ConfigService, newConfigService } from '../core/services/config/config-service';
import { ConfigStore, newFileConfigStore } from '../core/services/config/config-store';
import { McpClientService, newMcpClientService } from '../core/services/mcp-client/mcp-client-service';
import { ProfileService, newProfileService } from '../core/services/profile/profile-service';
import { ProfileStore, newFileProfileStore } from '../core/services/profile/profile-store';
import { RegistryProviderFactory, newRegistryProviderFactory } from '../core/services/registry/providers';
import { RegistryDefStore, newConfigRegistryDefStore } from '../core/services/registry/registry-def-store';
import { RegistryService, newRegistryService } from '../core/services/registry/registry-service';
import { SearchService, newSearchService } from '../core/services/search/search-service';
import { ServerService, newServerService } from '../core/services/server/server-service';
import { SessionManager, newSessionManager } from '../core/services/session/session-manager';
class App {
  private container: Container;
  private initPromise: Promise<void>;

  constructor() {
    this.container = new BaseContainer();
    this.initPromise = this.initializeDependencies();
  }

  public async init(): Promise<void> {
    await this.initPromise;
  }

  private async initializeDependencies(): Promise<void> {
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
    this.container.register<McpClientService>(
      "clientService",
      newMcpClientService()
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

    // Register SessionManager
    this.container.register<SessionManager>(
      "sessionManager",
      newSessionManager(
        this.container.get<Logger>("Logger"),
      )
    );

    // Register ServerService
    this.container.register<ServerService>(
      "serverService",
      newServerService()
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

  public getClientService(): McpClientService {
    return this.container.get<McpClientService>("clientService");
  }

  public getProfileService(): ProfileService {
    return this.container.get<ProfileService>("profileService");
  }

  public getSessionManager(): SessionManager {
    return this.container.get<SessionManager>("sessionManager");
  }

  public getServerService(): ServerService {
    return this.container.get<ServerService>("serverService");
  }
}

const newApp = (): App => {
  return new App();
};

export {
  App,
  newApp
};
