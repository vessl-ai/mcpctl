import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import assert from "assert";
import fs from "fs";
import { z } from "zod";

const logger = {
  path: "/Users/kyle/vessl/code/mcpctl/script/test-mcp-server.log",
  info: (...args: any[]) => {
    fs.appendFileSync(
      logger.path,
      `${new Date().toISOString()} ${args.join(" ")}\n`
    );
  },
  error: (...args: any[]) => {
    fs.appendFileSync(
      logger.path,
      `${new Date().toISOString()} ${args.join(" ")}\n`
    );
  },
};

const main = async () => {
  // Create an MCP server
  const server = new McpServer({
    name: "Demo",
    version: "1.0.0",
  });

  logger.info("Server created");

  // Add an addition tool
  server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  }));

  // Add a dynamic greeting resource
  server.resource(
    "greeting",
    new ResourceTemplate("greeting://{name}", { list: undefined }),
    async (uri, { name }) => ({
      contents: [
        {
          uri: uri.href,
          text: `Hello, ${name}!`,
        },
      ],
    })
  );

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // console.log("server transport", server.server.transport);
  // console.log("transport", transport);

  assert(server.server.transport === transport);

  const originalOnMessage = server.server.transport!.onmessage;
  server.server.transport!.onmessage = (message) => {
    logger.info("Message", JSON.stringify(message));
    originalOnMessage!(message);
  };
  const originalOnError = server.server.transport!.onerror;
  server.server.transport!.onerror = (error) => {
    logger.error("Error", JSON.stringify(error));
    originalOnError!(error);
  };
  const originalOnClose = server.server.transport!.onclose;
  server.server.transport!.onclose = () => {
    logger.info("Close");
    originalOnClose!();
  };

  // console.log("Server connected");
};

main();
