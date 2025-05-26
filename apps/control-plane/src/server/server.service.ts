import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { TransportType } from '@vessl-ai/mcpctl-shared/types/common';
import {
  ServerInstance,
  ServerInstanceStatus,
  ServerRunSpec,
} from '@vessl-ai/mcpctl-shared/types/domain/server';
import {
  generateServerInstanceId,
  generateServerRunSpecId,
} from '@vessl-ai/mcpctl-shared/util';
import { spawn } from 'child_process';
import { AppCacheService } from '../cache/appcache.service';
import { ServerCacheKeys } from '../types/cache';
import { findFreePort } from '../util/network';

@Injectable()
export class ServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServerService.name);
  constructor(private readonly appCacheService: AppCacheService) {}

  private instances: Record<string, ServerInstance> = {};

  async onModuleInit() {
    this.logger.log('Initializing server service...');
    // load all instances from the cache
    const instances = await this.appCacheService.get<ServerInstance[]>(
      ServerCacheKeys.INSTANCE,
    );
    if (instances) {
      this.instances = instances.reduce((acc, instance) => {
        acc[instance.id] = instance;
        return acc;
      }, {});
    }
  }
  async onModuleDestroy() {
    this.logger.log('Disposing server service...');
    await this.dispose();
  }

  // Start a server
  async start(runSpec: ServerRunSpec): Promise<ServerInstance> {
    // Assign ID to the run spec
    runSpec.id = generateServerRunSpecId();

    // 1. start a mcp server with the run config
    let instance: ServerInstance;
    switch (runSpec.transport.type) {
      case TransportType.Stdio:
        instance = await this.startStdioServer(runSpec);
        break;
      case TransportType.Sse:
        instance = await this.startSseServer(runSpec);
        break;
      case TransportType.StreamableHttp:
        instance = await this.startStreamableHttpServer(runSpec);
        break;
    }
    // 2. save the server spec and instance to the cache
    this.instances[instance.id] = instance;
    await this.upsertRunSpecList(runSpec);
    await this.upsertInstanceList(instance);

    this.logger.debug(
      `Started server ${instance.id} with spec ${JSON.stringify(runSpec)}`,
    );

    return this.sanitizeResponseInstance(instance);
  }

  private async startStdioServer(
    runSpec: ServerRunSpec,
  ): Promise<ServerInstance> {
    // 1. start a mcp server with supergateway wrapper
    const serverInstance: ServerInstance = {
      id: generateServerInstanceId(),
      name: runSpec.name,
      runSpec,
      status: ServerInstanceStatus.Running,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      host: 'localhost',
      port: await findFreePort(),
      transport: runSpec.transport,
    };

    const child = spawn('npx', [
      'supergateway',
      'start',
      '--transport',
      runSpec.transport.type,
      '--port',
      serverInstance.port.toString(),
      '--baseUrl',
      `http://${serverInstance.host}:${serverInstance.port}`,
      '--ssePath',
      '/sse',
      '--messagePath',
      '/message',
    ]);

    serverInstance.processId = child.pid;
    serverInstance.processHandle = child;

    serverInstance.transport = {
      type: TransportType.Sse,
    };
    serverInstance.connectionUrl = `http://${serverInstance.host}:${serverInstance.port}/sse`;
    return serverInstance;
  }

  private async startSseServer(
    runSpec: ServerRunSpec,
  ): Promise<ServerInstance> {
    // TODO: Implement start logic
    throw new Error('Not implemented');
  }

  private async startStreamableHttpServer(
    runSpec: ServerRunSpec,
  ): Promise<ServerInstance> {
    // TODO: Implement start logic
    throw new Error('Not implemented');
  }

  private async upsertRunSpecList(runSpec: ServerRunSpec) {
    const runSpecList = await this.appCacheService.get<ServerRunSpec[]>(
      ServerCacheKeys.RUN_SPEC,
    );
    if (!runSpecList) {
      await this.appCacheService.set(ServerCacheKeys.RUN_SPEC, [runSpec]);
    } else {
      runSpecList.push(runSpec);
      await this.appCacheService.set(ServerCacheKeys.RUN_SPEC, runSpecList);
    }
  }

  private async upsertInstanceList(instance: ServerInstance) {
    const instanceList = await this.appCacheService.get<ServerInstance[]>(
      ServerCacheKeys.INSTANCE,
    );
    if (!instanceList) {
      await this.appCacheService.set(ServerCacheKeys.INSTANCE, [instance]);
    } else {
      instanceList.push(instance);
      await this.appCacheService.set(ServerCacheKeys.INSTANCE, instanceList);
    }
  }

  private async deleteRunSpecList(runSpec: ServerRunSpec) {
    const runSpecList = await this.appCacheService.get<ServerRunSpec[]>(
      ServerCacheKeys.RUN_SPEC,
    );
    if (runSpecList) {
      runSpecList.splice(runSpecList.indexOf(runSpec), 1);
      await this.appCacheService.set(ServerCacheKeys.RUN_SPEC, runSpecList);
    }
  }

  private async deleteInstanceList(instance: ServerInstance) {
    const instanceList = await this.appCacheService.get<ServerInstance[]>(
      ServerCacheKeys.INSTANCE,
    );
    if (instanceList) {
      instanceList.splice(instanceList.indexOf(instance), 1);
      await this.appCacheService.set(ServerCacheKeys.INSTANCE, instanceList);
    }
  }

  // Stop a server
  async stopInstance(name: string): Promise<ServerInstance> {
    const instance = await this.getInstanceByName(name);
    if (!instance) {
      throw new Error(`Instance ${name} not found`);
    }

    const instanceProcessHandle = this.instances[instance.id].processHandle;
    if (instanceProcessHandle) {
      instanceProcessHandle.kill();
    } else {
      if (instance.processId) {
        try {
          process.kill(instance.processId);
        } catch (error) {
          this.logger.error(`Failed to kill process ${instance.processId}`);
        }
      }
    }

    instance.status = ServerInstanceStatus.Stopped;
    await this.upsertInstanceList(instance);
    return this.sanitizeResponseInstance(instance);
  }

  // Restart a server
  async restartInstance(name: string): Promise<ServerInstance> {
    const instance = await this.stopInstance(name);
    return this.start(instance.runSpec);
  }

  // List all server instances
  async listInstances(): Promise<ServerInstance[]> {
    const instances = await this.appCacheService.get<ServerInstance[]>(
      ServerCacheKeys.INSTANCE,
    );
    if (!instances) {
      return [];
    }

    this.logger.debug(`Listing servers: ${JSON.stringify(instances)}`);

    return this.sanitizeResponseInstanceList(instances);
  }

  // List all server run specs
  async listRunSpecs(): Promise<ServerRunSpec[]> {
    const runSpecs = await this.appCacheService.get<ServerRunSpec[]>(
      ServerCacheKeys.RUN_SPEC,
    );

    this.logger.debug(`Listing servers: ${JSON.stringify(runSpecs)}`);
    return runSpecs ?? [];
  }

  async getInstanceByName(name: string): Promise<ServerInstance | undefined> {
    const instances = await this.appCacheService.get<ServerInstance[]>(
      ServerCacheKeys.INSTANCE,
    );
    const result = instances?.find((instance) => instance.name === name);
    return result ? this.sanitizeResponseInstance(result) : undefined;
  }

  async getRunSpecByName(name: string): Promise<ServerRunSpec | undefined> {
    const runSpecs = await this.appCacheService.get<ServerRunSpec[]>(
      ServerCacheKeys.RUN_SPEC,
    );
    return runSpecs?.find((runSpec) => runSpec.name === name);
  }

  async dispose() {
    // stop all instances
    this.logger.log('Stopping all instances...');
    const instances = await this.listInstances();
    for (const instance of instances) {
      await this.stopInstance(instance.name);
    }
    this.logger.log('All instances stopped');

    // backup the cache
    this.logger.log('Backing up cache...');
    const cache = await this.appCacheService.get<ServerRunSpec[]>(
      ServerCacheKeys.RUN_SPEC,
    );
    this.logger.log('Cache backed up');

    // clear the cache
    this.logger.log('Clearing cache...');
    await this.appCacheService.clear();
  }

  private sanitizeResponseInstance(instance: ServerInstance): ServerInstance {
    return {
      ...instance,
      processHandle: undefined,
    };
  }

  private sanitizeResponseInstanceList(
    instances: ServerInstance[],
  ): ServerInstance[] {
    return instances.map((instance) => this.sanitizeResponseInstance(instance));
  }
}
