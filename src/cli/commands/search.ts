import { Command } from "commander";
import { SearchResult } from "../../core/search/search-result";
import { App } from "../app";

type EntryResultFormat = {
  name: string;
  url: string;
  description: string;
  sourceUrl: string;
}

type RegistryResultFormat = {
  registry: string;
  items: EntryResultFormat[];
}

const formatSearchResult = (result: SearchResult): RegistryResultFormat[] => {
  const groupedResults = result.entries.reduce((acc, result) => {
    const registry = result.registry || 'unknown';
    if (!acc[registry]) {
      acc[registry] = [];
    }
    acc[registry].push({
      name: result.name,
      url: result.url,
      description: result.description,
      sourceUrl: result.sourceUrl
    });
    return acc;
  }, {} as Record<string, EntryResultFormat[]>);

  return Object.entries(groupedResults).map(([registry, items]) => ({
    registry,
    items
  }));
};

const buildSearchCommand = (app: App): Command => {
  const searchService = app.getSearchService();

  const searchCommand = new Command("search")
    .description("Search for MCP servers")
    .option("-r, --registry <registry name>", "Registry to search in, if not provided, all registries will be searched")
    .option("-q, --query <query>", "Query to search for")
    .option("-n, --name <name>", "Name of the MCP server")
    .option("-s, --semantic", "Use semantic search")


  searchCommand
    .action(async (options: any) => {
      const registry = options.registry;
      const query = options.query;
      const name = options.name;
      const semantic = options.semantic;
      if (!name && !query) {
        searchCommand.error("Either name or query must be provided");
      }

      if (name && query) {
        searchCommand.error("Only one of name or query can be provided");
      }
      
      let searchResult: SearchResult | null = null;

      if (registry) {
        if (semantic) {
          searchCommand.error("Semantic search is not supported yet");
        } else {
        if (query) {
          searchResult = await searchService.searchByQuery(query);
        } 
        if (name) {
          searchResult = await searchService.searchByRegistryAndName(registry, name);
        }
        }
      } else {
        if (semantic) {
          searchCommand.error("Semantic search is not supported yet");
        } else {
          if (name) {
            searchCommand.error("Name search is not supported for all registries");
          }
          if (query) {
            searchResult = await searchService.searchByQuery(query);
          }
        }
      }

      if (searchResult) {
        console.log(formatSearchResult(searchResult));
      } else {
        console.log("No results found");
      }
    });

  return searchCommand;
}

export { buildSearchCommand };
