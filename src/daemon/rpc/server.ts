import { createMessageConnection, MessageConnection } from 'vscode-jsonrpc/node';
import { Logger } from '../../lib/logger/logger';
import { Daemon, Instance } from "../../lib/rpc/protocol";
import { RPCTransport } from '../../lib/rpc/transport';
import { DaemonStatus } from '../../lib/types/daemon';
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
            this.connection = createMessageConnection(
                this.transport.reader,
                this.transport.writer
            );
            this.setupHandlers();
            this.connection.listen();
            this.logger.info("RPC connection established");
        } catch (error) {
            this.logger.error("Failed to setup RPC connection", error);
            throw error;
        }
    }

    private setupHandlers() {
        if (!this.connection) {
            throw new Error("Connection not established");
        }

        // Instance management handlers
        this.connection.onRequest(
            Instance.StartRequest.type,
            async ({ config }) => {
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

        this.connection.onRequest(Daemon.StatusRequest.type, async () => {
            this.logger.debug("Received daemon status request");
            const status: DaemonStatus = {
                isRunning: true,
                version: require('../../../package.json').version,
                uptime: Date.now() - this.startTime,
            };
            return status;
        });

        this.connection.onRequest(Daemon.ShutdownRequest.type, async () => {
            this.logger.debug("Received daemon shutdown request");
            process.kill(process.pid, 'SIGTERM');
        });
    }

    public listen(): void {
        // For server transports, wait for the first connection
        if ('_server' in this.transport) {
            (this.transport as any)._server.on('connection', () => {
                this.setupConnection();
            });
            this.logger.info("Waiting for RPC connections...");
        } else {
            // For client transports, setup connection immediately
            this.setupConnection();
        }
    }

    public dispose(): void {
        if (this.connection) {
            this.connection.dispose();
        }
        this.transport.dispose();
        this.logger.info("RPC server disposed");
    }
} 