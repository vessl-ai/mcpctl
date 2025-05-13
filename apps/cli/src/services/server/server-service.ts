import { Logger } from "@vessl-ai/mcpctl-core/logger";
import { DaemonRPCClient } from "@vessl-ai/mcpctl-core/rpc";
import { McpServerInstance } from "@vessl-ai/mcpctl-core/types";

export interface ServerService {
  listServers(): Promise<McpServerInstance[]>;
  stopServer(instanceId: string): Promise<void>;
}

class DefaultServerService implements ServerService {
  constructor(
    private readonly daemonClient: DaemonRPCClient,
    private readonly logger: Logger
  ) {}

  async listServers(): Promise<McpServerInstance[]> {
    try {
      const instances = await this.daemonClient.listInstances();
      this.logger.info("Listed servers", { instances });
      return instances;
    } catch (error) {
      this.logger.error("Error listing servers:", error);
      throw error;
    }
  }

  async stopServer(instanceId: string): Promise<void> {
    try {
      await this.daemonClient.stopInstance(instanceId);
    } catch (error) {
      this.logger.error("Error stopping server:", error);
      throw error;
    }
  }
}

export const newServerService = (
  daemonClient: DaemonRPCClient,
  logger: Logger
): ServerService => {
  return new DefaultServerService(daemonClient, logger);
};
