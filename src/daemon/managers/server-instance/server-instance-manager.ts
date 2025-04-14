import { Logger } from '../../../lib/logger/logger';
import { McpServerInstance, McpServerInstanceStatus } from '../../../lib/types/instance';
import { RunConfig } from '../../../lib/types/run-config';
import { ServerInstanceFactory } from './server-instance-factory';
import { BaseServerInstance } from './server-instance-impl';

export interface ServerInstanceManager {

  validateConfig(config: RunConfig): Promise<boolean>;

  // 서버 인스턴스 생성/시작
  startInstance(
    config: RunConfig,
  ): Promise<McpServerInstance>;

  // 서버 인스턴스 종료
  stopInstance(instanceId: string): Promise<void>;

  // 실행 중인 인스턴스 조회
  getInstance(instanceId: string): Promise<McpServerInstance | null>;

  // 모든 실행 중인 인스턴스 목록
  listInstances(): Promise<McpServerInstance[]>;

  // 인스턴스 상태 업데이트
  updateInstanceStatus(
    instanceId: string,
    status: Partial<McpServerInstance>
  ): Promise<void>;
} 

class DefaultServerInstanceManager implements ServerInstanceManager {
  // TODO: save to file as daemon can be restarted
  private configInstanceMap: Map<string, McpServerInstance>;
  private instances: Map<string, McpServerInstance>;

  constructor(
    private logger: Logger,
    private readonly serverInstanceFactory: ServerInstanceFactory
  ) {
    this.logger = this.logger.withContext('ServerInstanceManager');
    this.configInstanceMap = new Map();
    this.instances = new Map();
  }

  async validateConfig(config: RunConfig): Promise<boolean> {
    // TODO: add validation logic
    return true;
  }

  async startInstance(config: RunConfig): Promise<McpServerInstance> {
    try {
      if (!(await this.validateConfig(config))) {
        throw new Error("Invalid config");
      }

      if (this.configInstanceMap.has(config.id)) {
        // 만약 env가 업데이트 되었다면, 지우고 새로 생성
        this.logger.verbose(`Instance ${config.id} already exists, checking env`);
        const existingEnv = this.configInstanceMap.get(config.id)?.config.env || {};
        const newEnv = config.env || {};
        const isEnvEqual = Object.keys(existingEnv).length === Object.keys(newEnv).length &&
          Object.keys(existingEnv).every(key => existingEnv[key] === newEnv[key]);

        if (!isEnvEqual) {
          // 기존 인스턴스 정지는 백그라운드로 처리
          this.stopInstance(config.id).catch(err => {
            this.logger.error('Failed to stop instance in background:', err);
          });
          this.configInstanceMap.delete(config.id);
        } else {
          return this.configInstanceMap.get(config.id)!;
        }
      }

      // create server instance
      const serverInstance = await this.serverInstanceFactory.createServerInstance(config, this.logger);

      await serverInstance.start();

      this.logger.info(`Instance ${serverInstance.id} started`);
      
      serverInstance.status = McpServerInstanceStatus.RUNNING;
      serverInstance.startedAt = new Date().toISOString();
      serverInstance.lastUsedAt = new Date().toISOString();

      this.configInstanceMap.set(config.id, serverInstance);
      this.instances.set(serverInstance.id, serverInstance);

      return serverInstance;
    } catch (error) {
      this.logger.error('Failed to start instance:', error);
      throw error;
    }
  }

  async stopInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    try {
      // Worker 종료
      const serverInstance = this.instances.get(instanceId);
      if (!serverInstance) {
        throw new Error(`Server instance not found: ${instanceId}`);
      }

      if (serverInstance instanceof BaseServerInstance) {
        await serverInstance.stop();
      }

      // 인스턴스 상태 업데이트 - 과연 무슨 의미가 있나 어차피 지울건데
      instance.status = McpServerInstanceStatus.STOPPED;
      instance.lastUsedAt = new Date().toISOString();
      
      // 인스턴스 제거
      this.configInstanceMap.delete(instanceId);
      this.instances.delete(instanceId);
    } catch (error) {
      this.logger.error('Failed to stop instance:', error);
      instance.status = McpServerInstanceStatus.FAILED;
      instance.error = error as Error;
      throw error;
    }
  }

  async getInstance(instanceId: string): Promise<McpServerInstance | null> {
    return this.instances.get(instanceId) || null;
  }

  async listInstances(): Promise<McpServerInstance[]> {
    return Array.from(this.instances.values());
  }

  async updateInstanceStatus(instanceId: string, status: Partial<McpServerInstance>): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // 인스턴스 상태 업데이트
    Object.assign(instance, status);
    
    // lastUsedAt 자동 업데이트
    instance.lastUsedAt = new Date().toISOString();
  }
}

export const newServerInstanceManager = (
  logger: Logger,
  serverInstanceFactory: ServerInstanceFactory
): ServerInstanceManager => {
  return new DefaultServerInstanceManager(logger, serverInstanceFactory);
}; 