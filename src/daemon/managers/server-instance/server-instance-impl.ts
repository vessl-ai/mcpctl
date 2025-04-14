import { ChildProcess, spawn } from 'child_process';
import { getPortPromise } from 'portfinder';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../lib/logger/logger';
import { McpServerInstance, McpServerInstanceConnectionInfo, McpServerInstanceStatus } from '../../../lib/types/instance';
import { RunConfig } from '../../../lib/types/run-config';
 
// Base worker implementation
export abstract class BaseServerInstance implements McpServerInstance {
  id: string;
  status: McpServerInstanceStatus = McpServerInstanceStatus.STARTING;
  error?: Error;
  process?: ChildProcess;
  containerId?: string;
  connectionInfo: McpServerInstanceConnectionInfo;
  startedAt: string;
  lastUsedAt: string;

  constructor(public config: RunConfig, protected logger: Logger) {
    this.id = uuidv4();
    // TODO: Check again 
    this.connectionInfo = {
      transport: "sse",
      endpoint: `/server-instances/${this.id}/events`,
    };
    this.startedAt = new Date().toISOString();
    this.lastUsedAt = new Date().toISOString();
    this.logger = this.logger.withContext(`ServerInstance:${this.id}`);
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}

// Local process worker implementation
export class LocalServerInstance extends BaseServerInstance {

  async start(): Promise<void> {
    try {
      const port = await getPortPromise();
      this.process = spawn(
        'npx',
        [
          '-y',
          'supergateway',
          '--stdio',
          this.config.command,
          '--port',
          port.toString(),
          '--baseUrl',
          `http://localhost:${port}`,
          '--ssePath',
          '/sse',
          '--messagePath',
          '/message'
        ]
      );
      this.process.stdout?.on('data', (message: any) => {
        this.logger.debug('Received message from worker', message);
      });
      this.process.stderr?.on('data', (message: any) => {
        this.logger.error('Received error from worker', message);
      });
      this.connectionInfo.params = {
        port,
        baseUrl: `http://localhost:${port}`,
      };
      this.status = McpServerInstanceStatus.RUNNING;
    } catch (error) {
      this.status = McpServerInstanceStatus.FAILED;
      this.error = error as Error;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
    this.status = McpServerInstanceStatus.STOPPED;
  }
}

// Container worker implementation
class ContainerServerInstance extends BaseServerInstance {

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