import { v4 as uuidv4 } from 'uuid';
import { RegistryEntry } from "../../../client/core/lib/types/registry";
import { Orchestrator, Worker, WorkerConfig, WorkerConnectionInfo, WorkerFactory, WorkerStatus } from "./types";

// Base worker implementation
abstract class BaseWorker implements Worker {
  id: string;
  status: WorkerStatus = 'starting';
  error?: Error;
  connectionInfo: WorkerConnectionInfo;

  constructor(public config: WorkerConfig) {
    this.id = uuidv4();
    this.connectionInfo = {
      transport: "sse",
      endpoint: `/workers/${this.id}/events`,
    };
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}

// Local process worker implementation
class LocalWorker extends BaseWorker {
  private process?: any;  // TODO: Replace with proper process type

  async start(): Promise<void> {
    try {
      // TODO: Implement actual process spawning
      this.status = 'running';
    } catch (error) {
      this.status = 'failed';
      this.error = error as Error;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      // TODO: Implement actual process termination
      this.process = undefined;
    }
    this.status = 'stopped';
  }
}

// Container worker implementation
class ContainerWorker extends BaseWorker {
  private containerId?: string;

  async start(): Promise<void> {
    try {
      // TODO: Implement container creation and start
      this.status = 'running';
    } catch (error) {
      this.status = 'failed';
      this.error = error as Error;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.containerId) {
      // TODO: Implement container stop and removal
      this.containerId = undefined;
    }
    this.status = 'stopped';
  }
}

// Worker factory implementation
export class WorkerFactoryImpl implements WorkerFactory {
  async createWorker(config: WorkerConfig): Promise<Worker> {
    let worker: BaseWorker;

    // Legacy support: if registryEntry exists, use its hosting type
    if (config.registryEntry) {
      worker = config.registryEntry.hosting === "local" 
        ? new LocalWorker(config)
        : new ContainerWorker(config);
    } else {
      // Default to local worker for direct command execution
      worker = new LocalWorker(config);
    }

    await worker.start();
    return worker;
  }
}

// Orchestrator implementation
export class OrchestratorImpl implements Orchestrator {
  private workers: Map<string, Worker> = new Map();
  
  constructor(private readonly workerFactory: WorkerFactory) {}

  async getOrCreateWorker(config: WorkerConfig): Promise<Worker> {
    // 동일한 설정의 워커가 있는지 확인
    const existingWorker = Array.from(this.workers.values()).find(w => 
      w.status === 'running' && 
      w.config.command === config.command &&
      JSON.stringify(w.config.args) === JSON.stringify(config.args)
    );

    if (existingWorker) {
      return existingWorker;
    }

    // 새 워커 생성
    const worker = await this.workerFactory.createWorker(config);
    this.workers.set(worker.id, worker);
    return worker;
  }

  async getWorker(workerId: string): Promise<Worker | null> {
    return this.workers.get(workerId) || null;
  }

  async listWorkers(): Promise<Worker[]> {
    return Array.from(this.workers.values());
  }

  async removeWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker not found: ${workerId}`);
    }

    if (worker instanceof BaseWorker) {
      await worker.stop();
    }
    
    this.workers.delete(workerId);
  }

  async stopAll(): Promise<void> {
    const workerIds = Array.from(this.workers.keys());
    await Promise.all(workerIds.map(id => this.removeWorker(id)));
  }

  // Legacy support
  async getOrCreateWorkerLegacy(registryEntry: RegistryEntry, profile: string): Promise<Worker> {
    return this.getOrCreateWorker({
      command: registryEntry.url,
      registryEntry,
      profile
    });
  }
}

// Factory function to create a new orchestrator instance
export const newOrchestrator = (): Orchestrator => {
  const workerFactory = new WorkerFactoryImpl();
  return new OrchestratorImpl(workerFactory);
}; 