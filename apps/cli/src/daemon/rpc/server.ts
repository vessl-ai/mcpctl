import {
  Daemon,
  DaemonStatus,
  Instance,
  Logger,
  RPCTransport,
} from "@mcpctl/lib";
import {
  createMessageConnection,
  MessageConnection,
} from "vscode-jsonrpc/node";
import { ServerInstanceManager } from "../managers/server-instance/server-instance-manager";

export class RPCServer {
  private connection?: MessageConnection;
  private logger: Logger;
  private readonly startTime: number;
  private transport: RPCTransport;

  constructor(
    transport: RPCTransport,
    private instanceManager: ServerInstanceManager,
    logger: Logger
  ) {
    this.logger = logger.withContext("RPCServer");
    this.transport = transport;
    this.startTime = Date.now();
  }

  private setupConnection() {
    try {
      this.logger.info("Setting up RPC connection...");
      this.connection = createMessageConnection(
        this.transport.reader,
        this.transport.writer
      );
      this.logger.debug("Message connection created");

      this.setupHandlers();
      this.connection.listen();
      this.logger.info("RPC connection established and handlers initialized");
    } catch (error) {
      this.logger.error("Failed to setup RPC connection", { error });
      throw error;
    }
  }

  private setupHandlers() {
    if (!this.connection) {
      const err = new Error(
        "Cannot setup handlers: Connection not established"
      );
      this.logger.error(err.message);
      throw err;
    }

    this.logger.debug("Setting up RPC request handlers...");

    // Instance management handlers
    this.connection.onRequest(
      Instance.StartRequest.type,
      async ({ config }) => {
        this.logger.info("Processing start instance request", {
          config,
        });
        try {
          const instance = await this.instanceManager.startInstance(config);
          this.logger.info("Instance started successfully", {
            instanceId: instance.id,
          });
          return instance;
        } catch (error) {
          this.logger.error("Failed to start instance", {
            error,
            config,
          });
          throw error;
        }
      }
    );

    this.connection.onRequest(
      Instance.StopRequest.type,
      async ({ instanceId }) => {
        this.logger.info("Processing stop instance request", { instanceId });
        try {
          await this.instanceManager.stopInstance(instanceId);
          this.logger.info("Instance stopped successfully", { instanceId });
        } catch (error) {
          this.logger.error("Failed to stop instance", { error, instanceId });
          throw error;
        }
      }
    );

    this.connection.onRequest(
      Instance.GetRequest.type,
      async ({ instanceId }) => {
        this.logger.info("Processing get instance request", { instanceId });
        try {
          const instance = await this.instanceManager.getInstance(instanceId);
          this.logger.debug("Instance retrieval result", {
            instanceId,
            found: !!instance,
          });
          return instance;
        } catch (error) {
          this.logger.error("Failed to get instance", { error, instanceId });
          throw error;
        }
      }
    );

    this.connection.onRequest(Instance.ListRequest.type, async () => {
      this.logger.info("Processing list instances request");
      try {
        const instances = await this.instanceManager.listInstances();
        this.logger.debug("Instance list retrieved", {
          count: instances.length,
        });
        return instances;
      } catch (error) {
        this.logger.error("Failed to list instances", { error });
        throw error;
      }
    });

    // Instance status notifications
    this.connection.onNotification(
      Instance.StatusNotification.type,
      async ({ instanceId, status }) => {
        this.logger.info("Processing instance status notification", {
          instanceId,
          newStatus: status.status,
        });
        try {
          await this.instanceManager.updateInstanceStatus(instanceId, status);
          this.logger.debug("Instance status updated successfully", {
            instanceId,
          });
        } catch (error) {
          this.logger.error("Failed to update instance status", {
            error,
            instanceId,
          });
        }
      }
    );

    this.connection.onRequest(Daemon.StatusRequest.type, async () => {
      this.logger.info("Processing daemon status request");
      const status: DaemonStatus = {
        isRunning: true,
        version: require("../../../package.json").version,
        uptime: Date.now() - this.startTime,
      };
      this.logger.debug("Daemon status", { status });
      return status;
    });

    this.connection.onRequest(Daemon.ShutdownRequest.type, async () => {
      this.logger.info("Processing daemon shutdown request");
      process.kill(process.pid, "SIGTERM");
    });

    this.logger.info("All RPC handlers setup completed");
  }

  public listen(): void {
    this.logger.info("Starting RPC server...");
    // For server transports, wait for the first connection
    if ("_server" in this.transport) {
      this.logger.debug("Server transport detected, waiting for connections");
      (this.transport as any)._server.on("connection", () => {
        this.logger.info("New client connection received");
        this.setupConnection();
      });
      this.logger.info("RPC server ready and waiting for connections");
    } else {
      // For client transports, setup connection immediately
      this.logger.debug(
        "Client transport detected, setting up connection immediately"
      );
      this.setupConnection();
    }
  }

  public dispose(): void {
    this.logger.info("Disposing RPC server...");
    if (this.connection) {
      this.connection.dispose();
      this.logger.debug("RPC connection disposed");
    }
    this.transport.dispose();
    this.logger.info("RPC server disposed successfully");
  }
}
