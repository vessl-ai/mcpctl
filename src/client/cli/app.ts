import { BaseContainer, Container } from "../../lib/container/container";
import { Logger, newConsoleLogger } from "../../lib/logger/logger";
import {
  ConfigService,
  newConfigService,
} from "../core/services/config/config-service";
import {
  ConfigStore,
  newFileConfigStore,
} from "../core/services/config/config-store";
import {
  McpClientService,
  newMcpClientService,
} from "../core/services/mcp-client/mcp-client-service";
import {
  ProfileService,
  newProfileService,
} from "../core/services/profile/profile-service";
import {
  ProfileStore,
  newFileProfileStore,
} from "../core/services/profile/profile-store";
import {
  RegistryProviderFactory,
  newRegistryProviderFactory,
} from "../core/services/registry/providers";
import {
  RegistryDefStore,
  newConfigRegistryDefStore,
} from "../core/services/registry/registry-def-store";
import {
  RegistryService,
  newRegistryService,
} from "../core/services/registry/registry-service";
import {
  SearchService,
  newSearchService,
} from "../core/services/search/search-service";
import {
  ServerService,
  newServerService,
} from "../core/services/server/server-service";
import {
  SessionManager,
  newSessionManager,
} from "../core/services/session/session-manager";

type AppOptions = {
  verbose?: boolean;
  logger?: Logger;
};

class App {
  private container: Container;
  private initPromise: Promise<void>;

  constructor({ verbose = false, logger }: AppOptions) {
    this.container = new BaseContainer();
    this.initPromise = this.initializeDependencies({ verbose, logger });
  }

  public async init(): Promise<void> {
    await this.initPromise;
  }

  private async initializeDependencies({
    verbose = false,
    logger,
  }: AppOptions): Promise<void> {
    // Register core dependencies
    if (!logger) {
      console.log("No logger provided, using console logger");
    } else {
    }
    logger = logger || newConsoleLogger({ showVerbose: verbose });
    this.container.register<Logger>("Logger", logger);

    // Register ConfigService
    this.container.register<ConfigStore>(
      "configStore",
      newFileConfigStore(
        this.container.get<Logger>("Logger").withContext("ConfigStore")
      )
    );
    logger.debug("ConfigStore registered");
    this.container.register<ConfigService>(
      "configService",
      newConfigService(this.container.get<ConfigStore>("configStore"))
    );
    logger.debug("ConfigService registered");

    // Register RegistryService
    this.container.register<RegistryDefStore>(
      "registryDefStore",
      newConfigRegistryDefStore(
        this.container.get<ConfigService>("configService")
      )
    );
    logger.debug("RegistryDefStore registered");
    this.container.register<RegistryProviderFactory>(
      "registryProviderFactory",
      newRegistryProviderFactory()
    );
    logger.debug("RegistryProviderFactory registered");
    this.container.register<RegistryService>(
      "registryService",
      newRegistryService(
        this.container.get<RegistryDefStore>("registryDefStore"),
        this.container.get<RegistryProviderFactory>("registryProviderFactory")
      )
    );
    logger.debug("RegistryService registered");
    // Register SearchService
    this.container.register<SearchService>(
      "searchService",
      newSearchService(this.container.get<RegistryService>("registryService"))
    );
    logger.debug("SearchService registered");
    // Register ClientService
    this.container.register<McpClientService>(
      "clientService",
      newMcpClientService()
    );
    logger.debug("ClientService registered");
    // Register ProfileService
    this.container.register<ProfileStore>(
      "profileStore",
      newFileProfileStore()
    );
    logger.debug("ProfileStore registered");
    this.container.register<ProfileService>(
      "profileService",
      newProfileService(
        this.container.get<ProfileStore>("profileStore"),
        this.container.get<ConfigService>("configService")
      )
    );
    logger.debug("ProfileService registered");
    // Register SessionManager
    this.container.register<SessionManager>(
      "sessionManager",
      newSessionManager(
        this.container.get<Logger>("Logger").withContext("SessionManager")
      )
    );
    logger.debug("SessionManager registered");
    // Register ServerService
    this.container.register<ServerService>(
      "serverService",
      newServerService(
        this.container.get<Logger>("Logger").withContext("ServerService")
      )
    );
    logger.debug("ServerService registered");
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

  public getLogger(): Logger {
    return this.container.get<Logger>("Logger");
  }
}

const newApp = ({ verbose = false, logger }: AppOptions): App => {
  return new App({ verbose, logger });
};

export { App, newApp };
