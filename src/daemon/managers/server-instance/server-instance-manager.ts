import { Logger } from "../../../lib/logger/logger";
import {
  McpServerInstance,
  McpServerInstanceStatus,
} from "../../../lib/types/instance";
import { getRunConfigId, RunConfig } from "../../../lib/types/run-config";
import { ServerInstanceFactory } from "./server-instance-factory";
import { BaseServerInstance } from "./server-instance-impl";

export interface ServerInstanceManager {
  validateConfig(config: RunConfig): Promise<boolean>;

  // 서버 인스턴스 생성/시작
  startInstance(config: RunConfig): Promise<McpServerInstance>;

  // 서버 인스턴스 종료
  stopInstance(instanceId: string): Promise<void>;

  // 모든 인스턴스 종료
  stopAllInstances(): Promise<void>;

  // 실행 중인 인스턴스 조회
  getInstance(instanceId: string): Promise<McpServerInstance | null>;

  // 모든 실행 중인 인스턴스 목록
  listInstances(): Promise<McpServerInstance[]>;

  // 인스턴스 상태 업데이트
  updateInstanceStatus(
    instanceId: string,
    status: Partial<McpServerInstance>
  ): Promise<void>;

  dispose(): Promise<void>;
}

class DefaultServerInstanceManager implements ServerInstanceManager {
  // TODO: save to file as daemon can be restarted
  private configInstanceMap: Map<string, McpServerInstance>;
  private instances: Map<string, McpServerInstance>;

  constructor(
    private logger: Logger,
    private readonly serverInstanceFactory: ServerInstanceFactory
  ) {
    this.configInstanceMap = new Map();
    this.instances = new Map();
  }

  async validateConfig(config: RunConfig): Promise<boolean> {
    this.logger.debug("Validating server instance config", { config });

    if (!config.profileName || config.profileName.length === 0) {
      this.logger.error("Invalid Config Profile Name", { config });
      return false;
    }

    if (
      !config.serverName ||
      config.serverName.length === 0 ||
      config.serverName.includes(" ")
    ) {
      this.logger.error("Invalid Config Server Name", { config });
      return false;
    }

    if (!config.command || config.command.length === 0) {
      this.logger.error("Invalid Config Command", { config });
      return false;
    }

    if (!getRunConfigId(config)) {
      this.logger.error("Invalid Config Id", { config });
      return false;
    }

    return true;
  }

  async startInstance(config: RunConfig): Promise<McpServerInstance> {
    this.logger.info("Starting server instance", { config });
    if (!(await this.validateConfig(config))) {
      const error = new Error("Invalid config");
      this.logger.error("Config validation failed", { config });
      throw error;
    }

    const configId = getRunConfigId(config);

    try {
      if (this.configInstanceMap.has(configId)) {
        this.logger.info(`Instance ${configId} already exists`);

        const existingInstance = this.configInstanceMap.get(configId);
        if (!existingInstance) {
          this.logger.error("Existing instance not found", { configId });
          throw new Error(`Existing instance not found: ${configId}`);
        }
        if (existingInstance.status !== McpServerInstanceStatus.RUNNING) {
          this.logger.info("Instance is not running, recreating instance", {
            existingInstance,
          });
          await this.stopInstance(existingInstance.id);
        } else {
          this.logger.info("Instance is running, checking env configuration");
          const existingEnv = existingInstance.config.env || {};
          const newEnv = config.env || {};
          const isEnvEqual =
            Object.keys(existingEnv).length === Object.keys(newEnv).length &&
            Object.keys(existingEnv).every(
              (key) => existingEnv[key] === newEnv[key]
            );

          if (!isEnvEqual) {
            this.logger.info(
              "Environment configuration changed, recreating instance",
              { configId }
            );
            // 기존 인스턴스 정지는 백그라운드로 처리
            this.stopInstance(configId).catch((err) => {
              this.logger.error("Failed to stop instance in background:", {
                error: err,
                configId,
              });
            });
            this.configInstanceMap.delete(configId);
          } else {
            this.logger.info("Reusing existing instance", {
              configId,
            });
            return this.configInstanceMap.get(configId)!;
          }
        }
      }

      this.logger.info("Creating new server instance", {
        config: {
          ...config,
          secrets: Object.keys(config.secrets || {}),
        },
      });
      // create server instance
      const serverInstance =
        await this.serverInstanceFactory.createServerInstance(config);

      this.logger.info("Starting server instance process", {
        instanceId: serverInstance.id,
      });
      await serverInstance.start();

      this.logger.info(`Instance ${serverInstance.id} started successfully`, {
        serverInstance,
      });

      serverInstance.status = McpServerInstanceStatus.RUNNING;
      serverInstance.startedAt = new Date().toISOString();
      serverInstance.lastUsedAt = new Date().toISOString();

      this.configInstanceMap.set(configId, serverInstance);
      this.instances.set(serverInstance.id, serverInstance);

      this.logger.debug("Instance registered in manager", {
        instanceId: serverInstance.id,
        configId,
        status: serverInstance.status,
      });

      return serverInstance;
    } catch (error) {
      this.logger.error("Failed to start instance:", { error, configId });
      throw error;
    }
  }

  async stopInstance(instanceId: string): Promise<void> {
    this.logger.info("Stopping server instance", { instanceId });

    const instance = this.instances.get(instanceId);
    if (!instance) {
      const error = new Error(`Instance not found: ${instanceId}`);
      this.logger.error(error.message);
      throw error;
    }

    try {
      // Worker 종료
      const serverInstance = this.instances.get(instanceId);
      if (!serverInstance) {
        const error = new Error(`Server instance not found: ${instanceId}`);
        this.logger.error(error.message);
        throw error;
      }

      this.logger.debug("Stopping server instance process", { instanceId });
      if (serverInstance instanceof BaseServerInstance) {
        await serverInstance.stop();
      }

      // 인스턴스 상태 업데이트
      instance.status = McpServerInstanceStatus.STOPPED;
      instance.lastUsedAt = new Date().toISOString();

      // 인스턴스 제거
      this.configInstanceMap.delete(instanceId);
      this.instances.delete(instanceId);

      this.logger.info("Instance stopped and removed successfully", {
        instanceId,
      });
    } catch (error) {
      this.logger.error("Failed to stop instance:", { error, instanceId });
      instance.status = McpServerInstanceStatus.FAILED;
      instance.error = error as Error;
      throw error;
    }
  }

  async getInstance(instanceId: string): Promise<McpServerInstance | null> {
    this.logger.debug("Retrieving instance information", { instanceId });
    const instance = this.instances.get(instanceId) || null;
    this.logger.debug("Instance retrieval result", {
      instanceId,
      found: !!instance,
      status: instance?.status,
    });
    return instance;
  }

  async listInstances(): Promise<McpServerInstance[]> {
    this.logger.debug("Listing all instances");
    const instances = Array.from(this.instances.values());
    this.logger.debug("Instance list retrieved", { count: instances.length });
    return instances;
  }

  async updateInstanceStatus(
    instanceId: string,
    status: Partial<McpServerInstance>
  ): Promise<void> {
    this.logger.debug("Updating instance status", {
      instanceId,
      newStatus: status.status,
    });

    const instance = this.instances.get(instanceId);
    if (!instance) {
      const error = new Error(`Instance not found: ${instanceId}`);
      this.logger.error(error.message);
      throw error;
    }

    // 인스턴스 상태 업데이트
    Object.assign(instance, status);

    // lastUsedAt 자동 업데이트
    instance.lastUsedAt = new Date().toISOString();

    this.logger.debug("Instance status updated successfully", {
      instanceId,
      currentStatus: instance.status,
    });
  }

  async stopAllInstances(): Promise<void> {
    this.logger.info("Stopping all instances");
    const instances = Array.from(this.instances.values());
    for (const instance of instances) {
      await this.stopInstance(instance.id);
    }
  }
  async dispose(): Promise<void> {
    this.logger.info("Disposing server instance manager");
    await this.stopAllInstances();
    this.instances.clear();
    this.configInstanceMap.clear();
  }
}

export const newServerInstanceManager = (
  logger: Logger,
  serverInstanceFactory: ServerInstanceFactory
): ServerInstanceManager => {
  return new DefaultServerInstanceManager(logger, serverInstanceFactory);
};
