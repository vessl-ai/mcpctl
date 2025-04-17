import {
  createMessageConnection,
  MessageConnection,
} from "vscode-jsonrpc/node";
import { Logger } from "../../../../lib/logger/logger";
import { Daemon, Instance } from "../../../../lib/rpc/protocol";
import {
  RPCTransportFactory,
  RPCTransportOptions,
} from "../../../../lib/rpc/transport";
import { SocketTransportFactory } from "../../../../lib/rpc/transport/socket";
import { DaemonStatus } from "../../../../lib/types/daemon";
import { McpServerInstance } from "../../../../lib/types/instance";
import { RunConfig } from "../../../../lib/types/run-config";

export class DaemonRPCClient {
  private connection: MessageConnection;
  private static instance?: DaemonRPCClient;

  private constructor(connection: MessageConnection, private logger: Logger) {
    this.connection = connection;
    this.connection.listen();
    this.connection.onError((error) => {
      // @ts-ignore
      if (error.code === "ENOENT") {
        this.logger.error(
          "Daemon is not running, trying to start it by running `mcpctl daemon start`"
        );
      }
      this.logger.error("RPC client error", { error });
    });
  }

  static async getInstance(logger: Logger): Promise<DaemonRPCClient> {
    if (!this.instance) {
      this.instance = await this.create(
        new SocketTransportFactory(logger),
        {
          type: "socket",
          endpoint: "/tmp/mcp-daemon.sock",
        },
        logger
      );
    }
    return this.instance;
  }

  static async create(
    transportFactory: RPCTransportFactory,
    transportOptions: RPCTransportOptions,
    logger: Logger
  ): Promise<DaemonRPCClient> {
    const transport = await transportFactory.create(transportOptions);
    const connection = createMessageConnection(
      transport.reader,
      transport.writer
    );
    return new DaemonRPCClient(connection, logger);
  }

  // Instance management methods
  async startInstance(config: RunConfig): Promise<McpServerInstance> {
    this.logger.debug("Sending start instance request", { config });
    return await this.connection.sendRequest(Instance.StartRequest.type, {
      config,
    });
  }

  async stopInstance(instanceId: string): Promise<void> {
    this.logger.debug("Sending stop instance request", { instanceId });
    await this.connection.sendRequest(Instance.StopRequest.type, {
      instanceId,
    });
  }

  async getInstance(instanceId: string): Promise<McpServerInstance | null> {
    this.logger.debug("Sending get instance request", { instanceId });
    return await this.connection.sendRequest(Instance.GetRequest.type, {
      instanceId,
    });
  }

  async listInstances(): Promise<McpServerInstance[]> {
    this.logger.debug("Sending list instances request");
    return await this.connection.sendRequest(Instance.ListRequest.type, {});
  }

  // Instance status notification
  onInstanceStatusChange(
    callback: (instanceId: string, status: Partial<McpServerInstance>) => void
  ): void {
    this.connection.onNotification(
      Instance.StatusNotification.type,
      ({ instanceId, status }) => {
        this.logger.debug("Received instance status notification", {
          instanceId,
          status,
        });
        callback(instanceId, status);
      }
    );
  }

  async status(): Promise<DaemonStatus> {
    this.logger.debug("Sending status request");
    return await this.connection.sendRequest(Daemon.StatusRequest.type, {});
  }

  async shutdown(): Promise<void> {
    this.logger.debug("Sending shutdown request");
    await this.connection.sendRequest(Daemon.ShutdownRequest.type, {});
  }

  dispose(): void {
    this.connection.end();
    this.connection.dispose();
    DaemonRPCClient.instance = undefined;
    this.logger.verbose("RPC client disposed");
  }
}
