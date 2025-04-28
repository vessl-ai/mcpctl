import {
  ConfigService,
  ConfigStore,
  McpClientService,
  ProfileService,
  ProfileStore,
  RegistryDefStore,
  RegistryProviderFactory,
  RegistryService,
  SearchService,
  SecretService,
  SecretStore,
  ServerService,
  SessionManager,
  newConfigRegistryDefStore,
  newConfigService,
  newFileConfigStore,
  newFileProfileStore,
  newKeychainSecretStore,
  newMcpClientService,
  newProfileService,
  newRegistryProviderFactory,
  newRegistryService,
  newSearchService,
  newSecretService,
  newServerService,
  newSessionManager,
} from "@mcpctl/core";
import {
  BaseContainer,
  Container,
  LogLevel,
  Logger,
  newConsoleLogger,
} from "@mcpctl/lib";

type AppOptions = {
  logLevel?: LogLevel;
  logger?: Logger;
};

class App {
  private container: Container;
  private initPromise: Promise<void>;

  constructor({ logLevel = LogLevel.INFO, logger }: AppOptions) {
    this.container = new BaseContainer();
    this.initPromise = this.initializeDependencies({ logLevel, logger });
  }

  public async init(): Promise<void> {
    await this.initPromise;
  }

  private async initializeDependencies({
    logLevel = LogLevel.INFO,
    logger,
  }: AppOptions): Promise<void> {
    // Register core dependencies
    if (!logger) {
      console.log("No logger provided, using console logger");
    } else {
    }
    logger = logger || newConsoleLogger({ logLevel });
    this.container.register<Logger>("Logger", logger);

    this.registerConfigService(logger);
    this.registerRegistryService(logger);
    this.registerSearchService(logger);
    this.registerSecretService(logger);
    this.registerProfileService(logger);
    this.registerClientService(logger);
    this.registerSessionManager(logger);
    this.registerServerService(logger);
  }

  private registerServerService(logger: Logger) {
    this.container.register<ServerService>(
      "serverService",
      newServerService(
        this.container.get<Logger>("Logger").withContext("ServerService")
      )
    );
    logger.debug("ServerService registered");
  }

  private registerSessionManager(logger: Logger) {
    this.container.register<SessionManager>(
      "sessionManager",
      newSessionManager(
        this.container.get<Logger>("Logger").withContext("SessionManager")
      )
    );
    logger.debug("SessionManager registered");
  }

  private registerProfileService(logger: Logger) {
    this.container.register<ProfileStore>(
      "profileStore",
      newFileProfileStore()
    );
    logger.debug("ProfileStore registered");
    this.container.register<ProfileService>(
      "profileService",
      newProfileService(
        this.container.get<ProfileStore>("profileStore"),
        this.container.get<ConfigService>("configService"),
        this.container.get<SecretService>("secretService")
      )
    );
    logger.debug("ProfileService registered");
  }

  private registerSecretService(logger: Logger) {
    this.container.register<SecretStore>(
      "secretStore",
      newKeychainSecretStore()
    );
    logger.debug("SecretStore registered");
    this.container.register<SecretService>(
      "secretService",
      newSecretService(
        this.container.get<SecretStore>("secretStore"),
        this.container.get<ConfigService>("configService"),
        this.container.get<Logger>("Logger")
      )
    );
    logger.debug("SecretService registered");
  }

  private registerClientService(logger: Logger) {
    this.container.register<McpClientService>(
      "clientService",
      newMcpClientService(
        this.container.get<ProfileService>("profileService"),
        this.container.get<SecretService>("secretService"),
        this.container.get<Logger>("Logger")
      )
    );
    logger.debug("ClientService registered");
  }

  private registerSearchService(logger: Logger) {
    this.container.register<SearchService>(
      "searchService",
      newSearchService(this.container.get<RegistryService>("registryService"))
    );
    logger.debug("SearchService registered");
  }

  private registerRegistryService(logger: Logger) {
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
  }

  private registerConfigService(logger: Logger) {
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
  }

  public getConfigService(): ConfigService {
    const configService = this.container.get<ConfigService>("configService");
    if (!configService) {
      throw new Error("ConfigService not found");
    }
    return configService;
  }

  public getRegistryService(): RegistryService {
    const registryService =
      this.container.get<RegistryService>("registryService");
    if (!registryService) {
      throw new Error("RegistryService not found");
    }
    return registryService;
  }
  public getSearchService(): SearchService {
    const searchService = this.container.get<SearchService>("searchService");
    if (!searchService) {
      throw new Error("SearchService not found");
    }
    return searchService;
  }

  public getClientService(): McpClientService {
    const clientService = this.container.get<McpClientService>("clientService");
    if (!clientService) {
      throw new Error("ClientService not found");
    }
    return clientService;
  }

  public getProfileService(): ProfileService {
    const profileService = this.container.get<ProfileService>("profileService");
    if (!profileService) {
      throw new Error("ProfileService not found");
    }
    return profileService;
  }

  public getSessionManager(): SessionManager {
    const sessionManager = this.container.get<SessionManager>("sessionManager");
    if (!sessionManager) {
      throw new Error("SessionManager not found");
    }
    return sessionManager;
  }

  public getServerService(): ServerService {
    const serverService = this.container.get<ServerService>("serverService");
    if (!serverService) {
      throw new Error("ServerService not found");
    }
    return serverService;
  }

  public getSecretService(): SecretService {
    const secretService = this.container.get<SecretService>("secretService");
    if (!secretService) {
      throw new Error("SecretService not found");
    }
    return secretService;
  }

  public getLogger(): Logger {
    const logger = this.container.get<Logger>("Logger");
    if (!logger) {
      throw new Error("Logger not found");
    }
    return logger;
  }
}

const newApp = ({ logLevel = LogLevel.INFO, logger }: AppOptions): App => {
  return new App({ logLevel, logger });
};

export { App, newApp };
