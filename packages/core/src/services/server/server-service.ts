import { Logger, McpServerInstance } from "@mcpctl/lib";
import { DaemonRPCClient } from "../../lib/rpc/client";

export interface ServerService {
  listServers(): Promise<McpServerInstance[]>;
  stopServer(instanceId: string): Promise<void>;
}

export class DefaultServerService implements ServerService {
  constructor(private readonly logger: Logger) {}

  async listServers(): Promise<McpServerInstance[]> {
    let daemonClient: DaemonRPCClient | undefined;
    try {
      daemonClient = await DaemonRPCClient.getInstance(this.logger);
      const instances = await daemonClient.listInstances();
      return instances;
    } catch (error) {
      console.error("Error listing servers:", error);
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
      console.error("Error stopping server:", error);
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
