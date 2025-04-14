import { createMessageConnection, MessageConnection } from 'vscode-jsonrpc/node';
import { Logger } from '../../lib/logger/logger';
import { Config, Instance } from "../../lib/rpc/protocol";
import { RPCTransport } from '../../lib/rpc/transport';
import { ServerInstanceManager } from "../managers/server-instance/server-instance-manager";
import { RunConfigStore } from '../services/config/factory';

export class RPCServer {
  private connection: MessageConnection;
  private logger: Logger;

  constructor(
    transport: RPCTransport,
    private instanceManager: ServerInstanceManager,
    private configStore: RunConfigStore,
    logger: Logger
  ) {
    this.logger = logger.withContext("RPCServer");
    this.connection = createMessageConnection(
      transport.reader,
      transport.writer
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    // Instance management handlers
    this.connection.onRequest(
      Instance.StartRequest.type.method,
      async ({ configId, env }) => {
        this.logger.debug("Received start instance request", { configId });
        return await this.instanceManager.startInstance(configId, env);
      }
    );

    this.connection.onRequest(
      Instance.StopRequest.type,
      async ({ instanceId }) => {
        this.logger.debug("Received stop instance request", { instanceId });
        await this.instanceManager.stopInstance(instanceId);
      }
    );

    this.connection.onRequest(
      Instance.GetRequest.type.method,
      async ({ instanceId }) => {
        this.logger.debug("Received get instance request", { instanceId });
        return await this.instanceManager.getInstance(instanceId);
      }
    );

    this.connection.onRequest(Instance.ListRequest.type.method, async () => {
      this.logger.debug("Received list instances request");
      return await this.instanceManager.listInstances();
    });

    // Config management handlers
    this.connection.onRequest(Config.SaveRequest.type, async ({ config }) => {
      this.logger.debug("Received save config request", { config });
      await this.configStore.saveConfig(config);
    });

    this.connection.onRequest(Config.GetRequest.type, async ({ configId }) => {
      this.logger.debug("Received get config request", { configId });
      return await this.configStore.getConfig(configId);
    });

    this.connection.onRequest(Config.ListRequest.type, async () => {
      this.logger.debug("Received list configs request");
      return await this.configStore.listConfigs();
    });

    this.connection.onRequest(
      Config.DeleteRequest.type,
      async ({ configId }) => {
        this.logger.debug("Received delete config request", { configId });
        await this.configStore.deleteConfig(configId);
      }
    );

    // Instance status notifications
    this.connection.onNotification(
      Instance.StatusNotification.type,
      async ({ instanceId, status }) => {
        this.logger.debug("Received instance status notification", {
          instanceId,
          status,
        });
        await this.instanceManager.updateInstanceStatus(instanceId, status);
      }
    );
  }

  public listen(): void {
    this.connection.listen();
    this.logger.info("RPC server started listening");
  }

  public dispose(): void {
    this.connection.dispose();
    this.logger.info("RPC server disposed");
  }
} 