import { McpServerInstance } from "../../../../lib/types/instance";
import { DaemonRPCClient } from "../../lib/rpc/client";

export interface ServerService {
  listServers(): Promise<McpServerInstance[]>;
  stopServer(instanceId: string): Promise<void>;  
}

class DefaultServerService implements ServerService {
  constructor(
  ) {}

  async listServers(): Promise<McpServerInstance[]> {
    let daemonClient: DaemonRPCClient | undefined;
    try {
      daemonClient = await DaemonRPCClient.getInstance();
      const instances = await daemonClient.listInstances();
      return instances;
    } catch (error) {
      console.error('Error listing servers:', error);
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
      daemonClient = await DaemonRPCClient.getInstance();
      await daemonClient.stopInstance(instanceId);
    } catch (error) {
      console.error('Error stopping server:', error);
      throw error;
    } finally {
      if (daemonClient) {
        daemonClient.dispose();
      }
    }
  }
}

export const newServerService = (): ServerService => {
  return new DefaultServerService();
}
