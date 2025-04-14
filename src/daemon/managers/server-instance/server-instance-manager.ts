import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../lib/logger/logger';
import { McpServerInstance } from '../../../lib/types/instance';
import { RunConfigStore } from '../../services/config/factory';
import { Orchestrator } from '../../services/orchestrator/types';

export interface ServerInstanceManager {
  // 서버 인스턴스 생성/시작
  startInstance(
    configId: string,
    env?: Record<string, string>
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
  private instances: Map<string, McpServerInstance>;

  constructor(
    private orchestrator: Orchestrator,
    private runConfigStore: RunConfigStore,
    private logger: Logger
  ) {
    this.instances = new Map();
  }

  async startInstance(configId: string, envOverrides?: Record<string, string>): Promise<McpServerInstance> {
    // 실행 설정 로드
    const config = await this.runConfigStore.getConfig(configId);
    if (!config) {
      throw new Error(`Run configuration not found: ${configId}`);
    }

    try {
      // Worker 생성 또는 조회
      const worker = await this.orchestrator.getOrCreateWorker({
        command: config.command,
        args: config.args,
        env: {
          ...config.env,
          ...envOverrides
        }
      });

      // 인스턴스 정보 생성
      const instance: McpServerInstance = {
        id: uuidv4(),
        workerId: worker.id,
        config,
        status: 'running',
        startedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        connectionInfo: worker.connectionInfo
      };

      // 인스턴스 저장
      this.instances.set(instance.id, instance);

      // 설정 사용 시간 업데이트
      await this.runConfigStore.updateConfig(config.id, {
        lastUsed: instance.startedAt
      });

      return instance;
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
      await this.orchestrator.removeWorker(instance.workerId);
      
      // 인스턴스 상태 업데이트
      instance.status = 'stopped';
      instance.lastUsedAt = new Date().toISOString();
      
      // 인스턴스 제거
      this.instances.delete(instanceId);
    } catch (error) {
      this.logger.error('Failed to stop instance:', error);
      instance.status = 'failed';
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
  orchestrator: Orchestrator,
  runConfigStore: RunConfigStore,
  logger: Logger
): ServerInstanceManager => {
  return new DefaultServerInstanceManager(orchestrator, runConfigStore, logger);
}; 