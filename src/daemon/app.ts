import fs from "fs";
import { logLevel } from "../core/lib/env";
import {
  ConfigService,
  newConfigService,
} from "../core/services/config/config-service";
import {
  ConfigStore,
  newFileConfigStore,
} from "../core/services/config/config-store";
import {
  newSecretService,
  SecretService,
} from "../core/services/secret/secret-service";
import {
  newKeychainSecretStore,
  SecretStore,
} from "../core/services/secret/secret-store";
import { BaseContainer, Container } from "../lib/container/container";
import { newConsoleLogger } from "../lib/logger/console-logger";
import { Logger } from "../lib/logger/logger";
import { SocketTransportFactory } from "../lib/rpc/transport/socket";
import { newServerInstanceFactory } from "./managers/server-instance/server-instance-factory";
import {
  newServerInstanceManager,
  ServerInstanceManager,
} from "./managers/server-instance/server-instance-manager";
import { RPCServer } from "./rpc/server";
export class DaemonApp {
  private container: Container;
  private rpcServer!: RPCServer;
  private initPromise: Promise<void>;
  constructor() {
    this.container = new BaseContainer();
    this.initializeDependencies();
    this.initPromise = this.createRpcServer();
  }

  public async init(): Promise<void> {
    const logger = this.container.get<Logger>("logger");
    logger.info("Initializing daemon application...");
    await this.initPromise;
    logger.info("Daemon application initialized successfully");
  }

  private initializeDependencies(): void {
    // 기본 의존성
    const logDir = "/var/log/mcpctl";
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    console.log("logDir", logDir);
    this.container.register<Logger>(
      "logger",
      newConsoleLogger({
        prefix: "Daemon",
        logLevel: logLevel(),
        useStderr: false,
      })
    );

    const logger = this.container.get<Logger>("logger");
    logger.info("Initializing dependencies...");
    logger.debug("Log directory created/verified at:", { logDir });

    this.registerConfigService(logger);
    this.registerSecretService(logger);

    // 서버 인스턴스 매니저
    this.registerServerInstanceManager(logger);
    logger.info("Server instance manager initialized");
    logger.info("All dependencies initialized successfully");
  }

  private registerConfigService(logger: Logger) {
    this.container.register<ConfigStore>(
      "configStore",
      newFileConfigStore(logger.withContext("ConfigStore"))
    );
    this.container.register<ConfigService>(
      "configService",
      newConfigService(this.container.get<ConfigStore>("configStore"))
    );
  }

  private registerSecretService(logger: Logger) {
    this.container.register<SecretStore>(
      "secretStore",
      newKeychainSecretStore()
    );
    this.container.register<SecretService>(
      "secretService",
      newSecretService(
        this.container.get<SecretStore>("secretStore"),
        this.container.get<ConfigService>("configService"),
        logger.withContext("SecretService")
      )
    );
  }

  private registerServerInstanceManager(logger: Logger) {
    this.container.register<ServerInstanceManager>(
      "instanceManager",
      newServerInstanceManager(
        logger.withContext("ServerInstanceManager"),
        newServerInstanceFactory(
          this.container.get<SecretService>("secretService"),
          logger.withContext("ServerInstanceFactory")
        )
      )
    );
  }

  private async createRpcServer(): Promise<void> {
    const logger = this.container.get<Logger>("logger");
    logger.info("Creating RPC server...");

    // create uds socket file
    const socketFile = "/tmp/mcp-daemon.sock";
    if (fs.existsSync(socketFile)) {
      logger.debug("Removing existing socket file:", { socketFile });
      fs.unlinkSync(socketFile);
    }

    const transportFactory = new SocketTransportFactory(logger);
    logger.debug("Creating socket transport...");
    const transport = await transportFactory.create({
      type: "socket",
      endpoint: socketFile,
      params: {
        isServer: true, // Enable server mode
      },
    });
    logger.debug("Socket transport created successfully");

    this.rpcServer = new RPCServer(
      transport,
      this.getInstanceManager(),
      logger
    );
    this.rpcServer.listen();
    logger.info("RPC server started and listening on socket:", { socketFile });
  }

  public getInstanceManager(): ServerInstanceManager {
    return this.container.get<ServerInstanceManager>("instanceManager");
  }

  public async dispose(): Promise<void> {
    const logger = this.container.get<Logger>("logger");
    logger.info("Disposing daemon application...");
    await this.getInstanceManager().dispose();
    this.rpcServer.dispose();
    logger.info("Daemon application disposed successfully");
  }
}

export const newDaemonApp = (): DaemonApp => {
  return new DaemonApp();
};
