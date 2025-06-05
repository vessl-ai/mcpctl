import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransportType } from '@vessl-ai/mcpctl-shared/types/common';
import { SecretRef } from '@vessl-ai/mcpctl-shared/types/domain/secret';
import {
  ServerInstance,
  ServerInstanceStatus,
  ServerRunSpec,
} from '@vessl-ai/mcpctl-shared/types/domain/server';
import {
  generateServerInstanceId,
  generateServerRunSpecId,
} from '@vessl-ai/mcpctl-shared/util';
import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { AppCacheService } from '../cache/appcache.service';
import { SecretService } from '../secret/secret.service';
import { ServerCacheKeys } from '../types/cache';
import { findFreePort } from '../util/network';

@Injectable()
export class ServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServerService.name);
  constructor(
    private readonly appCacheService: AppCacheService,
    private readonly configService: ConfigService,
    private readonly secretService: SecretService,
  ) {}

  private instances: Record<string, ServerInstance> = {};

  async onModuleInit() {
    this.logger.log('Initializing server service...');
    // load all instances from the cache
    const instances = await this.appCacheService.get<
      Record<string, ServerInstance>
    >(ServerCacheKeys.INSTANCE);
    if (instances) {
      this.instances = instances;
    }
  }
  async onModuleDestroy() {
    this.logger.log('Disposing server service...');
    await this.dispose();
  }

  private async getServerInstances(): Promise<Record<string, ServerInstance>> {
    if (Object.keys(this.instances).length > 0) {
      return this.instances;
    }
    const instances = await this.appCacheService.get<
      Record<string, ServerInstance>
    >(ServerCacheKeys.INSTANCE);
    this.instances = instances ?? {};
    return this.instances;
  }

  private async setServerInstances(instances: Record<string, ServerInstance>) {
    this.instances = instances;
    await this.appCacheService.set(ServerCacheKeys.INSTANCE, this.instances);
  }

  createLogFile(params: { instanceId: string }): Promise<{ logFile: string }> {
    const { instanceId } = params;
    const logDir = this.configService.get('app.logDir');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, `${instanceId}.log`);
    return Promise.resolve({ logFile });
  }

  // Start a server
  async start(runSpec: ServerRunSpec): Promise<ServerInstance> {
    // Assign ID to the run spec
    runSpec.id = generateServerRunSpecId();

    // 1. start a mcp server with the run config
    let instance: ServerInstance = await this.initializeServerInstance(runSpec);
    instance = await this.startServer(instance);

    // 2. save the server spec and instance to the cache
    this.instances[instance.id] = instance;
    await this.upsertRunSpecList(runSpec);
    await this.upsertInstanceList(instance);

    this.logger.debug(
      `Started server ${instance.id} with spec ${JSON.stringify(runSpec)}`,
    );

    return this.sanitizeResponseInstance(instance);
  }

  private async resolveSecret(
    secrets: Record<string, SecretRef> | undefined,
  ): Promise<Record<string, string>> {
    if (!secrets) {
      return {};
    }
    const resolvedSecret = {};
    for (const [key, secretRef] of Object.entries(secrets)) {
      const secret = await this.secretService.get(
        secretRef.source,
        secretRef.key,
      );
      resolvedSecret[key] = secret;
    }
    return resolvedSecret;
  }

  private async initializeServerInstance(
    runSpec: ServerRunSpec,
  ): Promise<ServerInstance> {
    // 1. start a mcp server with supergateway wrapper
    const port = runSpec.transport.port ?? (await findFreePort());
    const serverInstance: ServerInstance = {
      id: generateServerInstanceId(),
      name: runSpec.name,
      runSpec,
      status: ServerInstanceStatus.Running,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      host: runSpec.transport.host ?? 'localhost',
      port,
      transport: runSpec.transport,
    };

    const { logFile } = await this.createLogFile({
      instanceId: serverInstance.id,
    });

    const resolvedSecret = await this.resolveSecret(
      serverInstance.runSpec.secrets,
    );

    this.logger.debug(
      `Original secret: ${JSON.stringify(serverInstance.runSpec.secrets)}, Resolved secret: ${JSON.stringify(
        resolvedSecret,
      )}`,
    );

    const env: Record<string, string> = {
      ...serverInstance.runSpec.env,
      ...resolvedSecret,
    };
    if (process.env.PATH) {
      env['PATH'] = process.env.PATH; // add PATH for launchd, otherwise npx/node/npm will not be found!
    }

    serverInstance.logsPath = logFile;
    serverInstance.env = env;

    return serverInstance;
  }

  private async startServer(serverInstance: ServerInstance) {
    let child: ChildProcess | undefined;
    if (serverInstance.transport.type === TransportType.Stdio) {
      child = await this.startStdioServer(serverInstance);
    } else if (serverInstance.transport.type === TransportType.Sse) {
      child = await this.startSseServer(serverInstance);
    } else if (serverInstance.transport.type === TransportType.StreamableHttp) {
      child = await this.startStreamableHttpServer(serverInstance);
    }
    if (!child) {
      throw new Error(`Failed to start server ${serverInstance.id}`);
    }
    this.logger.debug(
      `Started server ${serverInstance.id} with args: ${child.spawnargs}, env: ${JSON.stringify(
        serverInstance.env,
      )}`,
    );

    child.on('error', (error) => {
      this.logger.error(
        `Failed to start server ${serverInstance.id}: ${error}`,
      );
    });

    if (serverInstance.logsPath) {
      const logFileStream = fs.createWriteStream(serverInstance.logsPath);
      if (child.stdout) {
        child.stdout.pipe(logFileStream);
      }
      if (child.stderr) {
        child.stderr.pipe(logFileStream);
      }
    }

    child.on('close', async (code, signal) => {
      this.logger.log(`Server ${serverInstance.id} closed with code ${code}`);
      const instance = (await this.getServerInstances())[serverInstance.id];
      if (instance) {
        instance.status = ServerInstanceStatus.Stopped;
        instance.updatedAt = new Date().toISOString();
        await this.setServerInstances(this.instances);
        await this.deleteRunSpecList(instance.runSpec);
      }
      this.logger.log(`Server ${serverInstance.id} stopped`);
    });

    serverInstance.processId = child.pid;
    serverInstance.processHandle = child;
    return serverInstance;
  }

  private async startStdioServer(
    serverInstance: ServerInstance,
  ): Promise<ChildProcess> {
    const child = spawn(
      'npx',
      [
        '-y',
        'supergateway',
        '--stdio',
        serverInstance.runSpec.command,
        '--port',
        serverInstance.port.toString(),
        '--baseUrl',
        `http://${serverInstance.host}:${serverInstance.port}`,
        '--ssePath',
        '/sse',
        '--messagePath',
        '/message',
      ],
      {
        env: serverInstance.env,
      },
    );

    serverInstance.transport = {
      type: TransportType.Sse,
    };
    serverInstance.connectionUrl = `http://${serverInstance.host}:${serverInstance.port}/sse`;

    return child;
  }

  private async startSseServer(
    serverInstance: ServerInstance,
  ): Promise<ChildProcess> {
    const [command, ...args] = serverInstance.runSpec.command.split(' ');
    const child = spawn(command, args, {
      env: serverInstance.env,
    });
    serverInstance.transport = {
      type: TransportType.Sse,
    };
    serverInstance.connectionUrl = `http://${serverInstance.host}:${serverInstance.port}/sse`;
    return child;
  }

  private async startStreamableHttpServer(
    serverInstance: ServerInstance,
  ): Promise<ChildProcess> {
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
    const instances = await this.getServerInstances();
    if (Object.keys(instances).length === 0) {
      await this.setServerInstances({
        [instance.id]: instance,
      });
    } else {
      instances[instance.id] = instance;
      await this.setServerInstances(instances);
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
    const instances = await this.getServerInstances();
    if (instances) {
      delete this.instances[instance.id];
      await this.setServerInstances(this.instances);
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
    const instances = await this.getServerInstances();
    if (!instances) {
      return [];
    }

    this.logger.debug(`Listing servers: ${JSON.stringify(instances)}`);

    return this.sanitizeResponseInstanceList(Object.values(instances));
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
    const instances = await this.getServerInstances();
    const result = Object.values(instances).find(
      (instance) => instance.name === name,
    );
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

  async removeServerInstance(serverName: string) {
    const instances = await this.getServerInstances();
    const instance = Object.values(instances).find(
      (instance) => instance.name === serverName,
    );
    if (!instance) {
      throw new Error(`Server ${serverName} not found`);
    }
    if (instance.status === ServerInstanceStatus.Running) {
      throw new Error(`Server ${serverName} is running, please stop it first`);
    }
    delete instances[serverName];
    await this.setServerInstances(instances);
    await this.deleteRunSpecList(instance.runSpec);
  }
}
