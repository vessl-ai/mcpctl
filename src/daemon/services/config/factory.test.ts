import { RunConfig } from '../../../lib/types/run-config';
import { newRunConfigStore, RunConfigStore } from './factory';

describe('RunConfigStore', () => {
  let store: RunConfigStore;

  beforeEach(() => {
    store = newRunConfigStore();
  });

  describe('saveConfig', () => {
    it('should save config and return id', async () => {
      const config: Omit<RunConfig, 'id'> = {
        serverName: 'test-server',
        profileName: 'test-profile',
        command: 'test-command',
        created: new Date().toISOString()
      };

      const id = await store.saveConfig(config);
      expect(id).toBeTruthy();

      const saved = await store.getConfig(id);
      expect(saved).toMatchObject({
        serverName: config.serverName,
        profileName: config.profileName,
        command: config.command,
        id
      });
      expect(saved?.created).toBeDefined();
    });
  });

  describe('getConfig', () => {
    it('should return null for non-existent config', async () => {
      const result = await store.getConfig('non-existent');
      expect(result).toBeNull();
    });

    it('should return config for existing id', async () => {
      const config: Omit<RunConfig, 'id'> = {
        serverName: 'test-server',
        profileName: 'test-profile',
        command: 'test-command',
        created: new Date().toISOString()
      };

      const id = await store.saveConfig(config);
      const result = await store.getConfig(id);
      expect(result).toEqual({
        ...config,
        id
      });
    });
  });

  describe('findConfig', () => {
    it('should find config by profile and server name', async () => {
      const config: Omit<RunConfig, 'id'> = {
        serverName: 'test-server',
        profileName: 'test-profile',
        command: 'test-command',
        created: new Date().toISOString()
      };

      await store.saveConfig(config);
      const found = await store.findConfig('test-profile', 'test-server');
      expect(found).toBeTruthy();
      expect(found?.serverName).toBe('test-server');
      expect(found?.profileName).toBe('test-profile');
    });

    it('should return null when no matching config exists', async () => {
      const result = await store.findConfig('non-existent', 'non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updateConfig', () => {
    it('should update existing config', async () => {
      const config: Omit<RunConfig, 'id'> = {
        serverName: 'test-server',
        profileName: 'test-profile',
        command: 'test-command',
        created: new Date().toISOString()
      };

      const id = await store.saveConfig(config);
      await store.updateConfig(id, { command: 'updated-command' });

      const updated = await store.getConfig(id);
      expect(updated?.command).toBe('updated-command');
    });

    it('should throw error for non-existent config', async () => {
      await expect(
        store.updateConfig('non-existent', { command: 'test' })
      ).rejects.toThrow('Config not found');
    });

    it('should not allow changing id', async () => {
      const config: Omit<RunConfig, 'id'> = {
        serverName: 'test-server',
        profileName: 'test-profile',
        command: 'test-command',
        created: new Date().toISOString()
      };

      const id = await store.saveConfig(config);
      await store.updateConfig(id, { id: 'new-id' } as Partial<RunConfig>);

      const updated = await store.getConfig(id);
      expect(updated?.id).toBe(id);
    });
  });

  describe('deleteConfig', () => {
    it('should delete existing config', async () => {
      const config: Omit<RunConfig, 'id'> = {
        serverName: 'test-server',
        profileName: 'test-profile',
        command: 'test-command',
        created: new Date().toISOString()
      };

      const id = await store.saveConfig(config);
      await store.deleteConfig(id);

      const deleted = await store.getConfig(id);
      expect(deleted).toBeNull();
    });

    it('should not throw error for non-existent config', async () => {
      await expect(store.deleteConfig('non-existent')).resolves.not.toThrow();
    });
  });

  describe('listConfigs', () => {
    it('should return empty array when no configs exist', async () => {
      const configs = await store.listConfigs();
      expect(configs).toEqual([]);
    });

    it('should return all saved configs', async () => {
      const config1: Omit<RunConfig, 'id'> = {
        serverName: 'server-1',
        profileName: 'profile-1',
        command: 'command-1',
        created: new Date().toISOString()
      };

      const config2: Omit<RunConfig, 'id'> = {
        serverName: 'server-2',
        profileName: 'profile-2',
        command: 'command-2',
        created: new Date().toISOString()
      };

      await store.saveConfig(config1);
      await store.saveConfig(config2);

      const configs = await store.listConfigs();
      expect(configs).toHaveLength(2);
      expect(configs.map(c => c.serverName)).toEqual(['server-1', 'server-2']);
    });
  });
}); 