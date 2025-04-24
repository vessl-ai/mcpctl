import { RegistryDef, RegistryType } from '../../lib/types/registry';
import { RegistryProvider, RegistryProviderFactory } from './providers';
import { RegistryDefStore } from './registry-def-store';
import { RegistryServiceImpl } from './registry-service';

describe('RegistryService', () => {
  let registryDefStore: jest.Mocked<RegistryDefStore>;
  let registryProviderFactory: jest.Mocked<RegistryProviderFactory>;
  let registryService: RegistryServiceImpl;

  const mockRegistryDef: RegistryDef = {
    name: 'test-registry',
    url: 'https://test.registry',
    knownType: RegistryType.GLAMA,
  };

  const mockRegistryProvider: RegistryProvider = {
    findEntryByName: jest.fn(),
    findEntriesByQuery: jest.fn(),
    findEntriesBySemanticQuery: jest.fn(),
  };

  beforeEach(() => {
    registryDefStore = {
      getRegistryDef: jest.fn(),
      addRegistryDef: jest.fn(),
      listRegistryDefs: jest.fn(),
      deleteRegistryDef: jest.fn(),
    } as jest.Mocked<RegistryDefStore>;

    registryProviderFactory = {
      createOrGetRegistryProvider: jest.fn(),
    } as jest.Mocked<RegistryProviderFactory>;

    registryDefStore.getRegistryDef.mockReturnValue(mockRegistryDef);
    registryDefStore.listRegistryDefs.mockReturnValue([mockRegistryDef]);
    registryProviderFactory.createOrGetRegistryProvider.mockReturnValue(mockRegistryProvider);

    registryService = new RegistryServiceImpl(registryDefStore, registryProviderFactory);
  });

  describe('getRegistryDef', () => {
    it('should return registry definition from store', () => {
      const registry = registryService.getRegistryDef('test-registry');

      expect(registryDefStore.getRegistryDef).toHaveBeenCalledWith('test-registry');
      expect(registry).toEqual(mockRegistryDef);
    });
  });

  describe('addRegistryDef', () => {
    it('should add registry definition to store', () => {
      const newRegistry: RegistryDef = {
        name: 'new-registry',
        url: 'https://new.registry',
        knownType: RegistryType.GLAMA,
      };

      registryService.addRegistryDef(newRegistry);

      expect(registryDefStore.addRegistryDef).toHaveBeenCalledWith(newRegistry);
    });
  });

  describe('listRegistryDefs', () => {
    it('should return list of registry definitions from store', () => {
      const registries = registryService.listRegistryDefs();

      expect(registryDefStore.listRegistryDefs).toHaveBeenCalled();
      expect(registries).toEqual([mockRegistryDef]);
    });
  });

  describe('getRegistryProvider', () => {
    it('should return provider for registry', () => {
      const provider = registryService.getRegistryProvider('test-registry');

      expect(registryDefStore.getRegistryDef).toHaveBeenCalledWith('test-registry');
      expect(registryProviderFactory.createOrGetRegistryProvider).toHaveBeenCalledWith(mockRegistryDef);
      expect(provider).toBe(mockRegistryProvider);
    });

    it('should throw error if registry not found', () => {
      registryDefStore.getRegistryDef.mockImplementation(() => {
        throw new Error('Registry not found');
      });

      expect(() => registryService.getRegistryProvider('non-existent')).toThrow('Registry not found');
    });
  });

  describe('deleteRegistryDef', () => {
    it('should delete registry definition from store', () => {
      registryService.deleteRegistryDef('test-registry');

      expect(registryDefStore.deleteRegistryDef).toHaveBeenCalledWith('test-registry');
    });
  });
});
