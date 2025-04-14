import { createMessageConnection, MessageConnection } from 'vscode-jsonrpc/node';
import { Logger } from '../../../lib/logger/logger';
import { Config, Instance } from '../../../lib/rpc/protocol';
import { RPCTransportFactory, RPCTransportOptions } from '../../../lib/rpc/transport';
import { McpServerInstance } from '../../../lib/types/instance';
import { RunConfig } from '../../../lib/types/run-config';

export class RPCClient {
    private connection: MessageConnection;
    private logger: Logger;

    private constructor(connection: MessageConnection, logger: Logger) {
        this.connection = connection;
        this.logger = logger.withContext('RPCClient');
        this.connection.listen();
    }

    static async create(
        transportFactory: RPCTransportFactory,
        transportOptions: RPCTransportOptions,
        logger: Logger
    ): Promise<RPCClient> {
        const transport = await transportFactory.create(transportOptions);
        const connection = createMessageConnection(transport.reader, transport.writer);
        return new RPCClient(connection, logger);
    }

    // Instance management methods
    async startInstance(configId: string, env?: Record<string, string>): Promise<McpServerInstance> {
        this.logger.debug('Sending start instance request', { configId });
        return await this.connection.sendRequest(Instance.StartRequest.type, { configId, env });
    }

    async stopInstance(instanceId: string): Promise<void> {
        this.logger.debug('Sending stop instance request', { instanceId });
        await this.connection.sendRequest(Instance.StopRequest.type, { instanceId });
    }

    async getInstance(instanceId: string): Promise<McpServerInstance | null> {
        this.logger.debug('Sending get instance request', { instanceId });
        return await this.connection.sendRequest(Instance.GetRequest.type, { instanceId });
    }

    async listInstances(): Promise<McpServerInstance[]> {
        this.logger.debug('Sending list instances request');
        return await this.connection.sendRequest(Instance.ListRequest.type, {});
    }

    // Config management methods
    async saveConfig(config: RunConfig): Promise<void> {
        this.logger.debug('Sending save config request', { config });
        await this.connection.sendRequest(Config.SaveRequest.type, { config });
    }

    async getConfig(configId: string): Promise<RunConfig | null> {
        this.logger.debug('Sending get config request', { configId });
        return await this.connection.sendRequest(Config.GetRequest.type, { configId });
    }

    async listConfigs(): Promise<RunConfig[]> {
        this.logger.debug('Sending list configs request');
        return await this.connection.sendRequest(Config.ListRequest.type, {});
    }

    async deleteConfig(configId: string): Promise<void> {
        this.logger.debug('Sending delete config request', { configId });
        await this.connection.sendRequest(Config.DeleteRequest.type, { configId });
    }

    // Instance status notification
    onInstanceStatusChange(callback: (instanceId: string, status: Partial<McpServerInstance>) => void): void {
        this.connection.onNotification(Instance.StatusNotification.type, ({ instanceId, status }) => {
            this.logger.debug('Received instance status notification', { instanceId, status });
            callback(instanceId, status);
        });
    }

    dispose(): void {
        this.connection.dispose();
        this.logger.info('RPC client disposed');
    }
} 