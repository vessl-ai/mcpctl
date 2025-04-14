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
    await this.initPromise;
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

    // 서버 인스턴스 매니저
    this.container.register<ServerInstanceManager>(
      "instanceManager",
      newServerInstanceManager(
        this.container.get<Logger>("logger"),
        newServerInstanceFactory(this.container.get<Logger>("logger"))
      )
    );
  }

  private async createRpcServer(): Promise<void> {
    // create uds socket file
    const socketFile = "/tmp/mcp-daemon.sock";
    if (fs.existsSync(socketFile)) {
      fs.unlinkSync(socketFile);
    }

    const transportFactory = new SocketTransportFactory();
    const transport = await transportFactory.create({
      type: "socket",
      endpoint: socketFile,
      params: {
        isServer: true  // Enable server mode
      }
    });
    this.rpcServer = new RPCServer(
      transport,
      this.getInstanceManager(),
      this.container.get<Logger>("logger")
    );
    this.rpcServer.listen();
  }

  public getInstanceManager(): ServerInstanceManager {
    return this.container.get<ServerInstanceManager>("instanceManager");
  }

  public dispose(): void {
    this.rpcServer.dispose();
  }
}

export const newDaemonApp = (): DaemonApp => {
  return new DaemonApp();
};
