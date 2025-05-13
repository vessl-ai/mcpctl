import { Logger } from "@vessl-ai/mcpctl-core/logger";
import { Daemon, Instance } from "@vessl-ai/mcpctl-core/proto";
import { DaemonStatus } from "@vessl-ai/mcpctl-core/types";
import { ServerInstanceManager } from "../managers/server-instance/server-instance-manager";
import express from "express";

export class RPCServer {
  private logger: Logger;
  private readonly startTime: number;
  private httpServer: express.Express;

  constructor(
    private instanceManager: ServerInstanceManager,
    logger: Logger
  ) {
    this.logger = logger.withContext("RPCServer");
    this.startTime = Date.now();
    this.httpServer = express();
  }

  private setupHttpServer() {
    try {
      this.httpServer.listen(3000, () => {
      this.logger.info("Listening on port 3000");
      );
      this.logger.info("Message connection created");

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
          config: {
            ...config,
            secrets: config.secrets ? Object.keys(config.secrets) : undefined,
          },
        });
        try {
          const instance = await this.instanceManager.startInstance(config);
          this.logger.info("Instance started successfully", {
            instanceId: instance.id,
          });
          return instance;
        } catch (error) {
          this.logger.error("Failed to start instance", {
            error: error instanceof Error ? error.message : String(error),
            config: {
              ...config,
              secrets: config.secrets ? Object.keys(config.secrets) : undefined,
            },
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
          this.logger.info("Instance retrieval result", {
            instanceId,
            found: !!instance,
          });
          return instance;
        } catch (error) {
          this.logger.error("Failed to get instance", {
            error: error instanceof Error ? error.message : String(error),
            instanceId,
          });
          throw error;
        }
      }
    );

    this.connection.onRequest(Instance.ListRequest.type, async () => {
      this.logger.info("Processing list instances request");
      try {
        const instances = await this.instanceManager.listInstances();
        this.logger.info("Instance list retrieved", {
          count: instances.length,
        });
        return instances;
      } catch (error) {
        this.logger.error("Failed to list instances", {
          error: error instanceof Error ? error.message : String(error),
        });
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
          this.logger.info("Instance status updated successfully", {
            instanceId,
          });
        } catch (error) {
          this.logger.error("Failed to update instance status", {
            error: error instanceof Error ? error.message : String(error),
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
      this.logger.info("Daemon status", { status });
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
