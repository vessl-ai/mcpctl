import { McpServerHostingType } from "../../../../lib/types/hosting";
import {
  RegistryDef,
  RegistryEntry,
  RegistryType,
} from "../../lib/types/registry";
import { SearchResultEntry } from "../../lib/types/search-result";
import { RegistryService } from "../registry/registry-service";
import { SearchServiceImpl, newSearchService } from "./search-service";

describe("SearchService", () => {
  let registryService: jest.Mocked<RegistryService>;
  let searchService: SearchServiceImpl;

  const mockRegistryEntry: RegistryEntry = {
    name: "test-entry",
    description: "Test entry description",
    url: "https://test.entry",
    sourceUrl: "https://source.test.entry",
    hosting: McpServerHostingType.LOCAL,
    attributes: ["test-attribute"],
  };

  const mockRegistryDef: RegistryDef = {
    name: "test-registry",
    url: "https://test.registry",
    knownType: RegistryType.GLAMA,
  };

  const expectedSearchResultEntry: SearchResultEntry = {
    registry: "test-registry",
    name: "test-entry",
    description: "Test entry description",
    url: "https://test.entry",
    sourceUrl: "https://source.test.entry",
    entry: mockRegistryEntry,
  };

  beforeEach(() => {
    const mockRegistryProvider = {
      findEntryByName: jest.fn(),
      findEntriesByQuery: jest.fn(),
      findEntriesBySemanticQuery: jest.fn(),
    };

    registryService = {
      getRegistryProvider: jest.fn().mockReturnValue(mockRegistryProvider),
      listRegistryDefs: jest.fn().mockReturnValue([mockRegistryDef]),
      getRegistryDef: jest.fn(),
      addRegistryDef: jest.fn(),
      deleteRegistryDef: jest.fn(),
    } as jest.Mocked<RegistryService>;

    searchService = new SearchServiceImpl(registryService);
  });

  describe("searchByRegistryAndName", () => {
    it("should find entry by exact name in specific registry", async () => {
      const registryProvider =
        registryService.getRegistryProvider("test-registry");
      (registryProvider.findEntryByName as jest.Mock).mockResolvedValue(
        mockRegistryEntry
      );

      const result = await searchService.searchByRegistryAndName(
        "test-registry",
        "test-entry"
      );

      expect(registryService.getRegistryProvider).toHaveBeenCalledWith(
        "test-registry"
      );
      expect(registryProvider.findEntryByName).toHaveBeenCalledWith(
        "test-entry",
        undefined
      );
      expect(result).toEqual({ entries: [expectedSearchResultEntry] });
    });
  });

  describe("searchByQueryForRegistry", () => {
    it("should find entries by query in specific registry", async () => {
      const registryProvider =
        registryService.getRegistryProvider("test-registry");
      (registryProvider.findEntriesByQuery as jest.Mock).mockResolvedValue([
        mockRegistryEntry,
      ]);

      const result = await searchService.searchByQueryForRegistry(
        "test-registry",
        "test"
      );

      expect(registryService.getRegistryProvider).toHaveBeenCalledWith(
        "test-registry"
      );
      expect(registryProvider.findEntriesByQuery).toHaveBeenCalledWith(
        "test",
        undefined
      );
      expect(result).toEqual({ entries: [expectedSearchResultEntry] });
    });
  });

  describe("searchBySemanticQueryForRegistry", () => {
    it("should find entries by semantic query in specific registry", async () => {
      const registryProvider =
        registryService.getRegistryProvider("test-registry");
      (
        registryProvider.findEntriesBySemanticQuery as jest.Mock
      ).mockResolvedValue([mockRegistryEntry]);

      const result = await searchService.searchBySemanticQueryForRegistry(
        "test-registry",
        "test description"
      );

      expect(registryService.getRegistryProvider).toHaveBeenCalledWith(
        "test-registry"
      );
      expect(registryProvider.findEntriesBySemanticQuery).toHaveBeenCalledWith(
        "test description",
        undefined
      );
      expect(result).toEqual({ entries: [expectedSearchResultEntry] });
    });
  });

  describe("searchByQuery", () => {
    it("should search across all registries", async () => {
      const registryProvider =
        registryService.getRegistryProvider("test-registry");
      (registryProvider.findEntriesByQuery as jest.Mock).mockResolvedValue([
        mockRegistryEntry,
      ]);

      const result = await searchService.searchByQuery("test");

      expect(registryService.listRegistryDefs).toHaveBeenCalled();
      expect(registryProvider.findEntriesByQuery).toHaveBeenCalledWith(
        "test",
        undefined
      );
      expect(result).toEqual({ entries: [expectedSearchResultEntry] });
    });
  });

  describe("searchBySemanticQuery", () => {
    it("should search semantically across all registries", async () => {
      const registryProvider =
        registryService.getRegistryProvider("test-registry");
      (
        registryProvider.findEntriesBySemanticQuery as jest.Mock
      ).mockResolvedValue([mockRegistryEntry]);

      const result = await searchService.searchBySemanticQuery(
        "test description"
      );

      expect(registryService.listRegistryDefs).toHaveBeenCalled();
      expect(registryProvider.findEntriesBySemanticQuery).toHaveBeenCalledWith(
        "test description",
        undefined
      );
      expect(result).toEqual({ entries: [expectedSearchResultEntry] });
    });
  });

  describe("newSearchService", () => {
    it("should create new instance of SearchService", () => {
      const service = newSearchService(registryService);
      expect(service).toBeInstanceOf(SearchServiceImpl);
    });
  });
});
