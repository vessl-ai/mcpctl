import { Logger } from "../../../lib/logger/logger";
import { McpServerInstance } from "../../../lib/types/instance";
import { DaemonRPCClient } from "../../lib/rpc/client";

export interface ServerService {
  listServers(): Promise<McpServerInstance[]>;
  stopServer(instanceId: string): Promise<void>;
}

class DefaultServerService implements ServerService {
  constructor(private readonly logger: Logger) {}

  async listServers(): Promise<McpServerInstance[]> {
    let daemonClient: DaemonRPCClient | undefined;
    try {
      daemonClient = await DaemonRPCClient.getInstance(this.logger);
      const instances = await daemonClient.listInstances();
      this.logger.info("Listed servers", { instances });
      return instances;
    } catch (error) {
      this.logger.error("Error listing servers:", error);
      throw error;
    } finally {
      if (daemonClient) {
        daemonClient.dispose();
      }
    }
  }

  async stopServer(instanceId: string): Promise<void> {
    let daemonClient: DaemonRPCClient | undefined;
    try {
      daemonClient = await DaemonRPCClient.getInstance(this.logger);
      await daemonClient.stopInstance(instanceId);
    } catch (error) {
      this.logger.error("Error stopping server:", error);
      throw error;
    } finally {
      if (daemonClient) {
        daemonClient.dispose();
      }
    }
  }
}

export const newServerService = (logger: Logger): ServerService => {
  return new DefaultServerService(logger);
};
