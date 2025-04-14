import { RegistryEntry } from '../../../client/core/lib/types/registry';
import { OrchestratorImpl, WorkerFactoryImpl } from './orchestrator';
import { Worker, WorkerConfig, WorkerFactory } from './types';

describe('OrchestratorImpl', () => {
  let orchestrator: OrchestratorImpl;
  let workerFactory: jest.Mocked<WorkerFactory>;

  const mockWorkerConfig: WorkerConfig = {
    command: 'test-command',
    args: ['--test'],
    env: { TEST: 'value' }
  };

  const mockWorker: Worker = {
    id: 'worker-1',
    config: mockWorkerConfig,
    status: 'running',
    connectionInfo: {
      transport: 'sse',
      endpoint: '/workers/worker-1/events'
    }
  };

  beforeEach(() => {
    workerFactory = {
      createWorker: jest.fn()
    } as jest.Mocked<WorkerFactory>;

    orchestrator = new OrchestratorImpl(workerFactory);
  });

  describe('getOrCreateWorker', () => {
    it('should return existing worker with same config', async () => {
      workerFactory.createWorker.mockResolvedValue(mockWorker);
      
      // 첫 번째 워커 생성
      const worker1 = await orchestrator.getOrCreateWorker(mockWorkerConfig);
      
      // 동일 설정으로 두 번째 요청
      const worker2 = await orchestrator.getOrCreateWorker(mockWorkerConfig);

      expect(worker1).toBe(worker2);
      expect(workerFactory.createWorker).toHaveBeenCalledTimes(1);
    });

    it('should create new worker for different config', async () => {
      const differentConfig = {
        ...mockWorkerConfig,
        command: 'different-command'
      };

      const differentWorker = {
        ...mockWorker,
        id: 'worker-2',
        config: differentConfig
      };

      workerFactory.createWorker
        .mockResolvedValueOnce(mockWorker)
        .mockResolvedValueOnce(differentWorker);

      const worker1 = await orchestrator.getOrCreateWorker(mockWorkerConfig);
      const worker2 = await orchestrator.getOrCreateWorker(differentConfig);

      expect(worker1).not.toBe(worker2);
      expect(workerFactory.createWorker).toHaveBeenCalledTimes(2);
    });

    it('should not reuse failed workers', async () => {
      const failedWorker = {
        ...mockWorker,
        status: 'failed' as const
      };

      workerFactory.createWorker
        .mockResolvedValueOnce(failedWorker)
        .mockResolvedValueOnce(mockWorker);

      await orchestrator.getOrCreateWorker(mockWorkerConfig);
      await orchestrator.getOrCreateWorker(mockWorkerConfig);

      expect(workerFactory.createWorker).toHaveBeenCalledTimes(2);
    });
  });

  describe('getWorker', () => {
    it('should return worker by id', async () => {
      workerFactory.createWorker.mockResolvedValue(mockWorker);
      await orchestrator.getOrCreateWorker(mockWorkerConfig);

      const worker = await orchestrator.getWorker(mockWorker.id);
      expect(worker).toBe(mockWorker);
    });

    it('should return null for non-existent worker', async () => {
      const worker = await orchestrator.getWorker('non-existent');
      expect(worker).toBeNull();
    });
  });

  describe('listWorkers', () => {
    it('should return all workers', async () => {
      const worker2 = {
        ...mockWorker,
        id: 'worker-2'
      };

      workerFactory.createWorker
        .mockResolvedValueOnce(mockWorker)
        .mockResolvedValueOnce(worker2);

      await orchestrator.getOrCreateWorker(mockWorkerConfig);
      await orchestrator.getOrCreateWorker({
        ...mockWorkerConfig,
        command: 'different-command'
      });

      const workers = await orchestrator.listWorkers();
      expect(workers).toHaveLength(2);
      expect(workers).toContainEqual(mockWorker);
      expect(workers).toContainEqual(worker2);
    });

    it('should return empty array when no workers exist', async () => {
      const workers = await orchestrator.listWorkers();
      expect(workers).toEqual([]);
    });
  });

  describe('removeWorker', () => {
    it('should remove existing worker', async () => {
      workerFactory.createWorker.mockResolvedValue(mockWorker);
      await orchestrator.getOrCreateWorker(mockWorkerConfig);

      await orchestrator.removeWorker(mockWorker.id);
      const removed = await orchestrator.getWorker(mockWorker.id);
      
      expect(removed).toBeNull();
    });

    it('should throw error for non-existent worker', async () => {
      await expect(orchestrator.removeWorker('non-existent'))
        .rejects.toThrow('Worker not found');
    });
  });

  describe('stopAll', () => {
    it('should stop and remove all workers', async () => {
      const worker2 = {
        ...mockWorker,
        id: 'worker-2'
      };

      workerFactory.createWorker
        .mockResolvedValueOnce(mockWorker)
        .mockResolvedValueOnce(worker2);

      await orchestrator.getOrCreateWorker(mockWorkerConfig);
      await orchestrator.getOrCreateWorker({
        ...mockWorkerConfig,
        command: 'different-command'
      });

      await orchestrator.stopAll();

      const remainingWorkers = await orchestrator.listWorkers();
      expect(remainingWorkers).toHaveLength(0);
    });
  });

  describe('getOrCreateWorkerLegacy', () => {
    it('should create worker with legacy config', async () => {
      const registryEntry: RegistryEntry = {
        url: 'test-url',
        hosting: 'local',
        name: 'test-entry',
        description: 'Test registry entry',
        sourceUrl: 'http://test.com',
        attributes: ['test-attribute']
      };

      workerFactory.createWorker.mockResolvedValue(mockWorker);

      const worker = await orchestrator.getOrCreateWorkerLegacy(registryEntry, 'test-profile');

      expect(workerFactory.createWorker).toHaveBeenCalledWith({
        command: registryEntry.url,
        registryEntry,
        profile: 'test-profile'
      });
      expect(worker).toBe(mockWorker);
    });
  });
});

describe('WorkerFactoryImpl', () => {
  let factory: WorkerFactoryImpl;

  beforeEach(() => {
    factory = new WorkerFactoryImpl();
  });

  it('should create local worker by default', async () => {
    const config: WorkerConfig = {
      command: 'test-command'
    };

    const worker = await factory.createWorker(config);
    expect(worker.connectionInfo.transport).toBe('sse');
    expect(worker.status).toBe('running');
  });

  it('should create local worker for local hosting', async () => {
    const config: WorkerConfig = {
      command: 'test-command',
      registryEntry: {
        url: 'test-url',
        hosting: 'local',
        name: 'test-entry',
        description: 'Test registry entry',
        sourceUrl: 'http://test.com',
        attributes: ['test-attribute']
      }
    };

    const worker = await factory.createWorker(config);
    expect(worker.connectionInfo.transport).toBe('sse');
    expect(worker.status).toBe('running');
  });

  it('should create container worker for remote hosting', async () => {
    const config: WorkerConfig = {
      command: 'test-command',
      registryEntry: {
        url: 'test-url',
        hosting: 'remote',
        name: 'test-entry',
        description: 'Test registry entry',
        sourceUrl: 'http://test.com',
        attributes: ['test-attribute']
      }
    };

    const worker = await factory.createWorker(config);
    expect(worker.connectionInfo.transport).toBe('sse');
    expect(worker.status).toBe('running');
  });
}); 