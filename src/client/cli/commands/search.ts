import arg from "arg";
import chalk from "chalk";
import fs from "fs";
import { OpenAI } from "openai";
import os from "os";
import path from "path";
import readline from "readline/promises";
import { SearchResult } from "../../core/lib/types/search-result";
import { App } from "../app";

type EntryResultFormat = {
  name: string;
  url: string;
  description: string;
  sourceUrl: string;
  hosting: string;
  attributes: string[];
};

type RegistryResultFormat = {
  registry: string;
  items: EntryResultFormat[];
};

const formatSearchResult = (result: SearchResult): RegistryResultFormat[] => {
  const groupedResults = result.entries.reduce((acc, result) => {
    const registry = result.registry || "unknown";
    if (!acc[registry]) {
      acc[registry] = [];
    }
    acc[registry].push({
      name: result.name,
      url: result.url,
      description: result.description,
      sourceUrl: result.sourceUrl,
      hosting: result.entry.hosting,
      attributes: result.entry.attributes,
    });
    return acc;
  }, {} as Record<string, EntryResultFormat[]>);

  return Object.entries(groupedResults).map(([registry, items]) => ({
    registry,
    items,
  }));
};

const printSearchResults = (results: RegistryResultFormat[]): void => {
  if (results.length === 0) {
    console.log(chalk.yellow("\nNo results found."));
    return;
  }

  console.log(chalk.bold("\nSearch Results:\n"));

  results.forEach((registryResult) => {
    console.log(chalk.bold.blue(`Registry: ${registryResult.registry}`));

    if (registryResult.items.length === 0) {
      console.log(chalk.dim("  No matches found in this registry\n"));
      return;
    }

    registryResult.items.forEach((item) => {
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

const searchCommandOptions = {
  "--registry": String,
  "--query": String,
  "--name": String,
  "--semantic": Boolean,
  "--limit": Number,
  "--help": Boolean,
  "--use-llm-interactive": Boolean,
  "-r": "--registry",
  "-q": "--query",
  "-n": "--name",
  "-s": "--semantic",
  "-l": "--limit",
  "-h": "--help",
  "-i": "--use-llm-interactive",
};

export const searchCommand = async (app: App, argv: string[]) => {
  const options = arg(searchCommandOptions, { argv });

  const help = options["--help"];
  const useLLMInteractive = options["--use-llm-interactive"];

  let registry = options["--registry"];
  let query = options["--query"];
  let name = options["--name"];
  let semantic = options["--semantic"];
  let limit = options["--limit"] || 10;

  if (help) {
    console.log(chalk.bold("Search Command Help"));
    console.log(chalk.dim("Usage: mcpctl search [options]"));
    console.log();
    console.log(chalk.dim("Options:"));
    console.log(chalk.dim("  -r, --registry: The registry to search in"));
    console.log(chalk.dim("  -q, --query: The query to search for"));
    console.log(
      chalk.dim("  -n, --name: The name of the MCP server to search for")
    );
    console.log(chalk.dim("  -s, --semantic: Use semantic search"));
    console.log(chalk.dim("  -l, --limit: The number of results to return"));
    console.log(chalk.dim("  -h, --help: Show this help message"));
    process.exit(0);
  }

  if (!name && !query) {
    console.error(chalk.red("Error: Either name or query must be provided"));
    process.exit(1);
  }

  if (name && query) {
    console.error(
      chalk.red("Error: Only one of name or query can be provided")
    );
    process.exit(1);
  }

  try {
    const searchService = app.getSearchService();
    let searchResult: SearchResult | null = null;

    if (registry) {
      if (semantic) {
        console.error(chalk.red("Error: Semantic search is not supported yet"));
        process.exit(1);
      } else {
        if (query) {
          searchResult = await searchService.searchByQueryForRegistry(
            registry,
            query,
            limit
          );
        }
        if (name) {
          searchResult = await searchService.searchByRegistryAndName(
            registry,
            name,
            limit
          );
        }
      }
    } else {
      if (semantic) {
        console.error(chalk.red("Error: Semantic search is not supported yet"));
        process.exit(1);
      } else {
        if (name) {
          console.error(
            chalk.red("Error: Name search is not supported for all registries")
          );
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

    if (useLLMInteractive) {
      console.log(
        chalk.bgGreen("Entering LLM interactive mode, query about results")
      );
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) {
        console.error(
          chalk.red(
            "Error: OPENAI_API_KEY is not set, currently only supports OPENAI"
          )
        );
        process.exit(1);
      }
      const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

      const client = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
      const systemPrompt = loadSystemPrompt();

      const assistant = await client.beta.assistants.create({
        model: OPENAI_MODEL,
        instructions: systemPrompt,
      });

      const thread = await client.beta.threads.create();
      await client.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Here are the search results:
        ${JSON.stringify(searchResult)}
        `,
      });

      const prompt = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      let finishInteractive = false;
      while (!finishInteractive) {
        const userQuestion = await prompt.question(
          chalk.bgYellow("Enter your question (type 'q' to quit): ")
        );
        if (userQuestion === "q") {
          finishInteractive = true;
          break;
        }
        // const response = await client.responses.create({
        //   model: "gpt-4o-mini",
        //   tools: [{ type: "web_search_preview_2025_03_11" }],
        //   input: [
        //     {
        //       type: "message",
        //       role: "system",
        //       content: systemPrompt,
        //     },
        //     {
        //       type: "message",
        //       role: "user",
        //       content: `Here are the search results:
        //       ${JSON.stringify(searchResult)}
        //       `,
        //     },
        //     ...chatHistory,
        //     {
        //       type: "message",
        //       role: "user",
        //       content: `Here is the user's question:
        //       ${userQuestion}
        //       `,
        //     },
        //   ],
        // });
        const response = await client.beta.threads.messages.create(thread.id, {
          role: "user",
          content: userQuestion,
        });

        const run = await client.beta.threads.runs.createAndPoll(thread.id, {
          assistant_id: assistant.id,
        });

        if (run.status === "completed") {
          const messages = await client.beta.threads.messages.list(
            run.thread_id
          );

          const outputMessage = messages.data.filter(
            (item) => item.role === "assistant"
          )[0];
          if (outputMessage) {
            const outputText = outputMessage.content.filter(
              (item) => item.type === "text"
            );
            if (outputText && outputText.length > 0) {
              console.log(chalk.bold(outputText[0].text));
            }
          }

          // const outputMessage = response.output.filter(
          //   (item) => item.type === "message"
          // )[0];
          //     (item) => item.type === "output_text"
          //   );
          //   if (outputText && outputText.length > 0) {
          //     console.log(chalk.bold(outputText[0].text));
          //     chatHistory.push({
          //       type: "message",
          //       role: "assistant",
          //       content: outputText[0].text,
          //     });
          //   }
        } else {
          console.log(chalk.red("Error: Failed to get the response"));
        }
      }
      prompt.close();
    }
  } catch (error) {
    console.error(
      chalk.red(
        `\nError: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`
      )
    );
    process.exit(1);
  }
};
function loadSystemPrompt() {
  let systemPrompt = `
          You are a helpful assistant that can answer questions about the search results.
          You will be given a list of search results, and you will need to answer the user's question based on the search results.
          You must visit the sourceUrl to get more information about the search results.
          You MUST acquire the excution command (start with npx or docker) for the mcp server.
           `;
  const systemPromptFilePath =
    process.env.MCPCTL_ASSISTANT_PROMPT_FILE ||
    path.join(os.homedir(), ".mcpctl", "assistant_prompt.json");
  if (fs.existsSync(systemPromptFilePath)) {
    const systemPromptFile = fs.readFileSync(systemPromptFilePath, "utf8");
    if (systemPromptFile) {
      const systemPromptJson = JSON.parse(systemPromptFile);
      if (
        systemPromptJson.searchAssistantPrompt &&
        systemPromptJson.searchAssistantPrompt.length > 0
      ) {
        systemPrompt = systemPromptJson.searchAssistantPrompt;
      }
    }
  }
  systemPrompt += `
  # Helpful information
  1. \`mcpctl\` is a CLI tool for managing MCP servers : read the specification at https://github.com/vessl-ai/mcpctl
  2. You can generate a mcpctl install command by step-by-step
    A. Visit the sourceUrl of the search result to get the execution command to install the MCP server.
    B. Fill the template:
      "mcpctl install --client <client:claude | cursor> --server-name <name> --command <command> [--profile <profile> --env <key1=value1> --env <key2=value2>]"
      # WARNING: You must fill the command with the exact command to install the MCP server, you can retrieve the command from VISITING the sourceUrl of the search result.
      # Examples
        mcpctl install --client claude --server-name my-mcp-server --command "npx -y @modelcontextprotocol/server-slack" --profile my-profile --env SLACK_BOT_TOKEN=xoxb-1234567890 --env SLACK_TEAM_ID=T00000000 --env SLACK_CHANNEL_ID=C000000000 --env SLACK_CHANNEL_IDS="C000000000,C000000001"
        mcpctl install --client cursor --server-name my-desktop-control --command "npx -y @wonderwhy-er/desktop-commander" --profile my-profile
    C. Always attach the sourceUrl so that the user can visit and verify the command. And make sure that users to double check the command before running it.
  `;

  return systemPrompt;
}
