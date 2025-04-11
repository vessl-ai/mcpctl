import chalk from "chalk";
import { Command } from "commander";
import { SearchResult } from "../../core/search/search-result";
import { App } from "../app";

type EntryResultFormat = {
  name: string;
  url: string;
  description: string;
  sourceUrl: string;
  hosting: string;
  attributes: string[];
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
      sourceUrl: result.sourceUrl,
      hosting: result.entry.hosting,
      attributes: result.entry.attributes
    });
    return acc;
  }, {} as Record<string, EntryResultFormat[]>);

  return Object.entries(groupedResults).map(([registry, items]) => ({
    registry,
    items
  }));
};

const printSearchResults = (results: RegistryResultFormat[]): void => {
  if (results.length === 0) {
    console.log(chalk.yellow("\nNo results found."));
    return;
  }

  console.log(chalk.bold("\nSearch Results:\n"));
  
  results.forEach(registryResult => {
    console.log(chalk.bold.blue(`Registry: ${registryResult.registry}`));
    
    if (registryResult.items.length === 0) {
      console.log(chalk.dim("  No matches found in this registry\n"));
      return;
    }

    registryResult.items.forEach(item => {
      console.log(chalk.bold.green(`\n  ${item.name}`));
      console.log(chalk.dim("  Description:"));
      console.log(`    ${item.description}`);
      console.log(chalk.dim("  Hosting:"));
      console.log(`    ${item.hosting || "Not specified"}`);
      console.log(chalk.dim("  Attributes:"));
      console.log(`    ${item.attributes?.join(", ") || "None"}`);
      console.log(chalk.dim("  URLs:"));
      console.log(`    Main URL:     ${chalk.cyan(item.url)}`);
      console.log(`    Source URL:   ${chalk.cyan(item.sourceUrl)}`);
    });
    console.log(); // Add empty line between registries
  });
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
        console.error(chalk.red("Error: Either name or query must be provided"));
        process.exit(1);
      }

      if (name && query) {
        console.error(chalk.red("Error: Only one of name or query can be provided"));
        process.exit(1);
      }
      
      try {
        let searchResult: SearchResult | null = null;

        if (registry) {
          if (semantic) {
            console.error(chalk.red("Error: Semantic search is not supported yet"));
            process.exit(1);
          } else {
            if (query) {
              searchResult = await searchService.searchByQueryForRegistry(registry, query);
            } 
            if (name) {
              searchResult = await searchService.searchByRegistryAndName(registry, name);
            }
          }
        } else {
          if (semantic) {
            console.error(chalk.red("Error: Semantic search is not supported yet"));
            process.exit(1);
          } else {
            if (name) {
              console.error(chalk.red("Error: Name search is not supported for all registries"));
              process.exit(1);
            }
            if (query) {
              searchResult = await searchService.searchByQuery(query);
            }
          }
        }

        if (searchResult) {
          const formattedResults = formatSearchResult(searchResult);
          printSearchResults(formattedResults);
        } else {
          console.log(chalk.yellow("\nNo results found."));
        }
      } catch (error) {
        console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : 'An unknown error occurred'}`));
        process.exit(1);
      }
    });

  return searchCommand;
}

export { buildSearchCommand };
