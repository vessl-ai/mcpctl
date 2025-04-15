import fs from 'fs';
import os from 'os';
import path from 'path';
import { verboseLog } from '../client/core/lib/env';
import { BaseContainer, Container } from '../lib/container/container';
import { newFileLogger } from '../lib/logger/file-logger';
import { Logger } from '../lib/logger/logger';
import { SocketTransportFactory } from '../lib/rpc/transport/socket';
import { newServerInstanceFactory } from './managers/server-instance/server-instance-factory';
import { newServerInstanceManager, ServerInstanceManager } from './managers/server-instance/server-instance-manager';
import { RPCServer } from './rpc/server';
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
    logger.info('Initializing daemon application...');
    await this.initPromise;
    logger.info('Daemon application initialized successfully');
  }

  private initializeDependencies(): void {
    // 기본 의존성
    const logDir = path.join(os.homedir(), ".mcpctl");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    this.container.register<Logger>(
      "logger",
      newFileLogger({
        filePath: path.join(logDir, "daemon.log"),
        prefix: "Daemon",
        showVerbose: verboseLog(),
      })
    );

    const logger = this.container.get<Logger>("logger");
    logger.info('Initializing dependencies...');
    logger.debug('Log directory created/verified at:', { logDir });

    // 서버 인스턴스 매니저
    this.container.register<ServerInstanceManager>(
      "instanceManager",
      newServerInstanceManager(
        logger,
        newServerInstanceFactory(logger)
      )
    );
    logger.info('Server instance manager initialized');
    logger.info('All dependencies initialized successfully');
  }

  private async createRpcServer(): Promise<void> {
    const logger = this.container.get<Logger>("logger");
    logger.info('Creating RPC server...');

    // create uds socket file
    const socketFile = "/tmp/mcp-daemon.sock";
    if (fs.existsSync(socketFile)) {
      logger.debug('Removing existing socket file:', { socketFile });
      fs.unlinkSync(socketFile);
    }

    const transportFactory = new SocketTransportFactory(logger);
    logger.debug('Creating socket transport...');
    const transport = await transportFactory.create({
      type: "socket",
      endpoint: socketFile,
      params: {
        isServer: true  // Enable server mode
      }
    });
    logger.debug('Socket transport created successfully');

    this.rpcServer = new RPCServer(
      transport,
      this.getInstanceManager(),
      logger
    );
    this.rpcServer.listen();
    logger.info('RPC server started and listening on socket:', { socketFile });
  }

  public getInstanceManager(): ServerInstanceManager {
    return this.container.get<ServerInstanceManager>("instanceManager");
  }

  public dispose(): void {
    const logger = this.container.get<Logger>("logger");
    logger.info('Disposing daemon application...');
    this.rpcServer.dispose();
    logger.info('Daemon application disposed successfully');
  }
}

export const newDaemonApp = (): DaemonApp => {
  return new DaemonApp();
};
