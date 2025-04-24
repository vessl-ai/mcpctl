import { Config } from '../../lib/types/config';
import { RegistryType } from '../../lib/types/registry';
import { ConfigServiceImpl, newConfigService } from './config-service';
import { ConfigStore } from './config-store';
import { defaultConfig } from './default-config';

describe('ConfigService', () => {
  let configStore: jest.Mocked<ConfigStore>;
  let configService: ConfigServiceImpl;

  const mockConfig: Config = {
    profile: {
      currentActiveProfile: 'test-profile',
      allProfiles: ['test-profile'],
    },
    registry: {
      registries: [
        {
          name: 'test-registry',
          url: 'test-url',
          knownType: RegistryType.GLAMA,
        },
      ],
    },
    secrets: {
      shared: {
        'test-secret': {
          key: 'test-secret',
          description: 'Test shared secret',
        },
      },
    },
    sharedEnv: {
      SHARED_VAR: 'shared_value',
    },
  };

  beforeEach(() => {
    configStore = {
      getConfig: jest.fn(),
      saveConfig: jest.fn(),
    } as jest.Mocked<ConfigStore>;

    configStore.getConfig.mockReturnValue(mockConfig);
    configService = new ConfigServiceImpl(configStore);
  });

  describe('constructor', () => {
    it('should load config from store', () => {
      expect(configStore.getConfig).toHaveBeenCalled();
      expect(configService.getConfig()).toEqual(mockConfig);
    });

    it('should use default config when store is empty', () => {
      configStore.getConfig.mockReturnValue({} as Config);
      configService = new ConfigServiceImpl(configStore);
      expect(configStore.saveConfig).toHaveBeenCalledWith({
        ...defaultConfig,
        secrets: { shared: {} },
      });
    });

    it('should use provided initial config', () => {
      const initialConfig = {
        ...mockConfig,
        profile: { currentActiveProfile: 'initial', allProfiles: ['initial'] },
      };
      configService = new ConfigServiceImpl(configStore, initialConfig);
      expect(configService.getConfig()).toEqual(initialConfig);
    });
  });

  describe('getConfig', () => {
    it('should return entire config', () => {
      const config = configService.getConfig();
      expect(config).toEqual(mockConfig);
    });
  });

  describe('getConfigSection', () => {
    it('should return profile section', () => {
      const profile = configService.getConfigSection('profile');
      expect(profile).toEqual(mockConfig.profile);
    });

    it('should return registry section', () => {
      const registry = configService.getConfigSection('registry');
      expect(registry).toEqual(mockConfig.registry);
    });

    it('should return secrets section', () => {
      const secrets = configService.getConfigSection('secrets');
      expect(secrets).toEqual(mockConfig.secrets);
    });

    it('should return sharedEnv section', () => {
      const sharedEnv = configService.getConfigSection('sharedEnv');
      expect(sharedEnv).toEqual(mockConfig.sharedEnv);
    });
  });

  describe('saveConfig', () => {
    it('should save current config to store', () => {
      configService.saveConfig();
      expect(configStore.saveConfig).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('updateConfig', () => {
    it('should merge partial config and save', () => {
      const update = {
        profile: {
          currentActiveProfile: 'updated-profile',
          allProfiles: ['updated-profile'],
        },
        secrets: {
          shared: {
            'new-secret': {
              key: 'new-secret',
              description: 'New shared secret',
            },
          },
        },
      };

      configService.updateConfig(update);

      const expected = {
        ...mockConfig,
        ...update,
      };

      expect(configStore.saveConfig).toHaveBeenCalledWith(expected);
      expect(configService.getConfig()).toEqual(expected);
    });

    it('should preserve unmodified sections', () => {
      const update = {
        profile: {
          currentActiveProfile: 'updated-profile',
          allProfiles: ['updated-profile'],
        },
      };

      configService.updateConfig(update);
      expect(configService.getConfig().registry).toEqual(mockConfig.registry);
      expect(configService.getConfig().secrets).toEqual(mockConfig.secrets);
    });
  });

  describe('newConfigService', () => {
    it('should create new instance with store', () => {
      const service = newConfigService(configStore);
      expect(service).toBeInstanceOf(ConfigServiceImpl);
    });

    it('should create new instance with store and initial config', () => {
      const service = newConfigService(configStore, mockConfig);
      expect(service).toBeInstanceOf(ConfigServiceImpl);
    });
  });
});
