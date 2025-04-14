import { Logger } from '../../../lib/logger/logger';
import { RunConfig } from '../../../lib/types/run-config';
import { RunConfigStore } from '../../services/config/factory';
import { Orchestrator, Worker } from '../../services/orchestrator/types';
import { newServerInstanceManager, ServerInstanceManager } from './server-instance-manager';

class MockLogger implements Logger {
  debug() {}
  info() {}
  warn() {}
  error() {}
  verbose() {}
  log() {}
  withContext(): Logger { return this; }
}

describe('ServerInstanceManager', () => {
  let manager: ServerInstanceManager;
  let orchestrator: jest.Mocked<Orchestrator>;
  let runConfigStore: jest.Mocked<RunConfigStore>;
  let logger: Logger;

  const mockConfig: RunConfig = {
    id: 'config-1',
    serverName: 'test-server',
    profileName: 'test-profile',
    command: 'test-command',
    args: ['--test'],
    env: { TEST: 'value' },
    created: new Date().toISOString()
  };

  const mockWorker: Worker = {
    id: 'worker-1',
    config: {
      command: 'test-command',
      args: ['--test'],
      env: { TEST: 'value' }
    },
    status: 'running',
    connectionInfo: {
      transport: 'sse',
      endpoint: 'test-endpoint'
    }
  };

  beforeEach(() => {
    orchestrator = {
      getOrCreateWorker: jest.fn(),
      getWorker: jest.fn(),
      listWorkers: jest.fn(),
      removeWorker: jest.fn(),
      stopAll: jest.fn(),
      getOrCreateWorkerLegacy: jest.fn()
    } as jest.Mocked<Orchestrator>;

    runConfigStore = {
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      saveConfig: jest.fn(),
      findConfig: jest.fn(),
      deleteConfig: jest.fn(),
      listConfigs: jest.fn()
    } as jest.Mocked<RunConfigStore>;

    logger = new MockLogger();

    manager = newServerInstanceManager(orchestrator, runConfigStore, logger);
  });

  describe('startInstance', () => {
    it('should start a new instance successfully', async () => {
      runConfigStore.getConfig.mockResolvedValue(mockConfig);
      orchestrator.getOrCreateWorker.mockResolvedValue(mockWorker);

      const result = await manager.startInstance('config-1');

      expect(result).toMatchObject({
        workerId: mockWorker.id,
        config: mockConfig,
        status: mockWorker.status,
        connectionInfo: mockWorker.connectionInfo,
        startedAt: expect.any(String),
        lastUsedAt: expect.any(String)
      });
      expect(runConfigStore.getConfig).toHaveBeenCalledWith('config-1');
      expect(orchestrator.getOrCreateWorker).toHaveBeenCalledWith({
        command: mockConfig.command,
        args: mockConfig.args,
        env: mockConfig.env
      });
    });

    it('should throw error when config not found', async () => {
      runConfigStore.getConfig.mockRejectedValue(new Error('Config not found'));

      await expect(manager.startInstance('non-existent')).rejects.toThrow('Config not found');
    });

    it('should merge environment overrides', async () => {
      runConfigStore.getConfig.mockResolvedValue(mockConfig);
      orchestrator.getOrCreateWorker.mockResolvedValue(mockWorker);

      await manager.startInstance('config-1', { OVERRIDE: 'test' });

      expect(orchestrator.getOrCreateWorker).toHaveBeenCalledWith({
        command: mockConfig.command,
        args: mockConfig.args,
        env: {
          ...mockConfig.env,
          OVERRIDE: 'test'
        }
      });
    });
  });

  describe('stopInstance', () => {
    it('should stop an instance successfully', async () => {
      runConfigStore.getConfig.mockResolvedValue(mockConfig);
      orchestrator.getOrCreateWorker.mockResolvedValue(mockWorker);
      const instance = await manager.startInstance('config-1');

      await manager.stopInstance(instance.id);

      expect(orchestrator.removeWorker).toHaveBeenCalledWith(instance.workerId);
    });

    it('should throw error for non-existent instance', async () => {
      await expect(manager.stopInstance('non-existent'))
        .rejects.toThrow('Instance not found');
    });
  });

  describe('getInstance', () => {
    it('should get instance details successfully', async () => {
      runConfigStore.getConfig.mockResolvedValue(mockConfig);
      orchestrator.getOrCreateWorker.mockResolvedValue(mockWorker);
      const instance = await manager.startInstance('config-1');

      const result = await manager.getInstance(instance.id);

      expect(result).toMatchObject({
        workerId: mockWorker.id,
        config: mockConfig,
        status: mockWorker.status,
        connectionInfo: mockWorker.connectionInfo,
        startedAt: expect.any(String),
        lastUsedAt: expect.any(String)
      });
    });

    it('should return null when instance not found', async () => {
      const result = await manager.getInstance('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('listInstances', () => {
    it('should list all instances', async () => {
      runConfigStore.getConfig.mockResolvedValue(mockConfig);
      orchestrator.getOrCreateWorker.mockResolvedValue(mockWorker);
      const instance = await manager.startInstance('config-1');

      const result = await manager.listInstances();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        workerId: mockWorker.id,
        config: mockConfig,
        status: mockWorker.status,
        connectionInfo: mockWorker.connectionInfo,
        startedAt: expect.any(String),
        lastUsedAt: expect.any(String)
      });
    });

    it('should return empty array when no instances exist', async () => {
      const instances = await manager.listInstances();
      expect(instances).toEqual([]);
    });

    it('should return all running instances', async () => {
      runConfigStore.getConfig.mockResolvedValue(mockConfig);
      orchestrator.getOrCreateWorker.mockResolvedValue(mockWorker);

      await manager.startInstance('config-1');
      await manager.startInstance('config-1');

      const instances = await manager.listInstances();
      expect(instances).toHaveLength(2);
    });
  });

  describe('updateInstanceStatus', () => {
    it('should update instance status', async () => {
      runConfigStore.getConfig.mockResolvedValue(mockConfig);
      orchestrator.getOrCreateWorker.mockResolvedValue(mockWorker);

      const instance = await manager.startInstance('config-1');
      await manager.updateInstanceStatus(instance.id, { status: 'failed' });

      const updated = await manager.getInstance(instance.id);
      expect(updated?.status).toBe('failed');
    });

    it('should throw error for non-existent instance', async () => {
      await expect(
        manager.updateInstanceStatus('non-existent', { status: 'failed' })
      ).rejects.toThrow('Instance not found');
    });

    it('should update lastUsedAt automatically', async () => {
      runConfigStore.getConfig.mockResolvedValue(mockConfig);
      orchestrator.getOrCreateWorker.mockResolvedValue(mockWorker);

      const instance = await manager.startInstance('config-1');
      const oldLastUsed = instance.lastUsedAt;

      await new Promise(resolve => setTimeout(resolve, 100));
      await manager.updateInstanceStatus(instance.id, { status: 'failed' });

      const updated = await manager.getInstance(instance.id);
      expect(updated?.lastUsedAt).not.toBe(oldLastUsed);
    });
  });
}); 