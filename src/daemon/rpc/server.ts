import { createMessageConnection, MessageConnection } from 'vscode-jsonrpc/node';
import { Logger } from '../../lib/logger/logger';
import { Instance } from "../../lib/rpc/protocol";
import { RPCTransport } from '../../lib/rpc/transport';
import { ServerInstanceManager } from "../managers/server-instance/server-instance-manager";

export class RPCServer {
  private connection: MessageConnection;
  private logger: Logger;

  constructor(
    transport: RPCTransport,
    private instanceManager: ServerInstanceManager,
    logger: Logger
  ) {
    this.logger = logger.withContext("RPCServer");
    this.connection = createMessageConnection(
      transport.reader,
      transport.writer
    );
  }

  private setupHandlers() {
    // Instance management handlers
    this.connection.onRequest(
      Instance.StartRequest.type,
      async ({ config, }) => {
        this.logger.debug("Received start instance request", { config });
        return await this.instanceManager.startInstance(config);
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
      Instance.GetRequest.type,
      async ({ instanceId }) => {
        this.logger.debug("Received get instance request", { instanceId });
        return await this.instanceManager.getInstance(instanceId);
      }
    );

    this.connection.onRequest(Instance.ListRequest.type, async () => {
      this.logger.debug("Received list instances request");
      return await this.instanceManager.listInstances();
    });

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
    this.setupHandlers();
    this.connection.listen();
    this.logger.info("RPC server started listening");
  }

  public dispose(): void {
    this.connection.dispose();
    this.logger.info("RPC server disposed");
  }
} 