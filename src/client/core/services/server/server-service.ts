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
    const daemonClient = await DaemonRPCClient.getInstance();
    return daemonClient.listInstances();
  }

  async stopServer(instanceId: string): Promise<void> {
    const daemonClient = await DaemonRPCClient.getInstance();
    return daemonClient.stopInstance(instanceId);
  }
}

export const newServerService = (): ServerService => {
  return new DefaultServerService();
}
