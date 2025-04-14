import { Logger } from '../../../lib/logger/logger';
import { McpServerInstance, McpServerInstanceStatus } from '../../../lib/types/instance';
import { newRunConfig, RunConfig } from '../../../lib/types/run-config';
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
  let logger: Logger;

  const mockConfig: RunConfig = {
    id: 'config-1',
    serverName: 'test-server',
    profileName: 'test-profile',
    command: 'test-command --arg1 --arg2s',
    env: { TEST: 'value' },
    created: new Date().toISOString()
  };

  const mockServerInstance: McpServerInstance = {
    id: 'server-instance-1',
    config: mockConfig,
    status: McpServerInstanceStatus.RUNNING,
    startedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    connectionInfo: {
      transport: 'sse',
      endpoint: 'test-endpoint'
    }
  };

  beforeEach(() => {
    logger = new MockLogger();

    manager = newServerInstanceManager(logger);
  });

  describe('startInstance', () => {
    it('should start a new instance successfully', async () => {

      const result = await manager.startInstance(mockConfig);

      const list = await manager.listInstances(); 
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({
        id: result.id,
        config: mockConfig,
        status: result.status,
        connectionInfo: result.connectionInfo,
        startedAt: expect.any(String),
        lastUsedAt: expect.any(String),
      });
    });
    
    it('should throw error when config is wrong', async () => {

      const spy = jest.spyOn(manager, 'validateConfig');
      spy.mockResolvedValue(false);

      await expect(manager.startInstance(mockConfig)).rejects.toThrow(
        "Invalid config"
      );
    });

    it('should create a new instance if env is updated', async () => {

      const instance = await manager.startInstance(mockConfig);
      const updatedInstance = await manager.startInstance(newRunConfig({
        ...mockConfig,
        env: {
          ...mockConfig.env,
          OVERRIDE: 'test'
        }
      }));

      expect(updatedInstance.id).not.toBe(instance.id);
    });
  });

  describe('stopInstance', () => {
    it('should stop an instance successfully', async () => {
      const instance = await manager.startInstance(mockConfig);

      await manager.stopInstance(instance.id);

      const list = await manager.listInstances();
      expect(list).toHaveLength(0);
    });

    it('should throw error for non-existent instance', async () => {
      await expect(manager.stopInstance('non-existent'))
        .rejects.toThrow('Instance not found');
    });
  });

  describe('getInstance', () => {
    it('should get instance details successfully', async () => {
      const instance = await manager.startInstance(mockConfig);

      const result = await manager.getInstance(instance.id);

      expect(result).toMatchObject({
        id: instance.id,
        config: mockConfig,
        status: instance.status,
        connectionInfo: instance.connectionInfo,
        startedAt: expect.any(String),
      });
    });

    it('should return null when instance not found', async () => {
      const result = await manager.getInstance('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('listInstances', () => {
    it('should list all instances', async () => {
      const instance = await manager.startInstance(mockConfig);

      const result = await manager.listInstances();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: instance.id,
        config: mockConfig,
        status: instance.status,
        connectionInfo: instance.connectionInfo,
        startedAt: expect.any(String),
        lastUsedAt: expect.any(String)
      });
    });

    it('should return empty array when no instances exist', async () => {
      const instances = await manager.listInstances();
      expect(instances).toEqual([]);
    });

    it('should run only one if same config', async () => {

      await manager.startInstance(mockConfig);
      await manager.startInstance(mockConfig);

      const instances = await manager.listInstances();
      expect(instances).toHaveLength(1);
    });

    it('should run multiple if different command', async () => {
      const config2 = {
        ...mockConfig,
        id: 'config-2',
        command: 'different-command'

      };

      await manager.startInstance(mockConfig);
      await manager.startInstance(config2);

      const instances = await manager.listInstances();
      expect(instances).toHaveLength(2);
    });
  });

  describe('updateInstanceStatus', () => {
    it('should update instance status', async () => {

      const instance = await manager.startInstance(mockConfig);
      await manager.updateInstanceStatus(instance.id, { status: McpServerInstanceStatus.FAILED });

      const updated = await manager.getInstance(instance.id);
      expect(updated?.status).toBe(McpServerInstanceStatus.FAILED);
    });

    it('should throw error for non-existent instance', async () => {
      await expect(
        manager.updateInstanceStatus('non-existent', { status: McpServerInstanceStatus.FAILED })
      ).rejects.toThrow('Instance not found');
    });

    it('should update lastUsedAt automatically', async () => {

      const instance = await manager.startInstance(mockConfig);
      const oldLastUsed = instance.lastUsedAt;

      await new Promise(resolve => setTimeout(resolve, 100));
      await manager.updateInstanceStatus(instance.id, { status: McpServerInstanceStatus.FAILED });

      const updated = await manager.getInstance(instance.id);
      expect(updated?.lastUsedAt).not.toBe(oldLastUsed);
    });
  });
}); 