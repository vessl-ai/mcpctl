import { v4 as uuidv4 } from 'uuid';
import { McpServerInstance, McpServerInstanceConnectionInfo, McpServerInstanceStatus } from '../../../lib/types/instance';
import { RunConfig } from '../../../lib/types/run-config';
 
// Base worker implementation
export abstract class BaseServerInstance implements McpServerInstance {
  id: string;
  status: McpServerInstanceStatus = McpServerInstanceStatus.STARTING;
  error?: Error;
  connectionInfo: McpServerInstanceConnectionInfo;
  startedAt: string;
  lastUsedAt: string;

  constructor(public config: RunConfig) {
    this.id = uuidv4();
    // TODO: Check again 
    this.connectionInfo = {
      transport: "sse",
      endpoint: `/server-instances/${this.id}/events`,
    };
    this.startedAt = new Date().toISOString();
    this.lastUsedAt = new Date().toISOString();
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}

// Local process worker implementation
export class LocalServerInstance extends BaseServerInstance {
  private process?: any;  // TODO: Replace with proper process type

  async start(): Promise<void> {
    try {
      // TODO: Implement actual process spawning
      this.status = McpServerInstanceStatus.RUNNING;
    } catch (error) {
      this.status = McpServerInstanceStatus.FAILED;
      this.error = error as Error;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      // TODO: Implement actual process termination
      this.process = undefined;
    }
    this.status = McpServerInstanceStatus.STOPPED;
  }
}

// Container worker implementation
class ContainerServerInstance extends BaseServerInstance {
  private containerId?: string;

  async start(): Promise<void> {
    try {
      // TODO: Implement container creation and start
      this.status = McpServerInstanceStatus.RUNNING;
    } catch (error) {
      this.status = McpServerInstanceStatus.FAILED;
      this.error = error as Error;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.containerId) {
      // TODO: Implement container stop and removal
      this.containerId = undefined;
    }
    this.status = McpServerInstanceStatus.STOPPED;
  }
}