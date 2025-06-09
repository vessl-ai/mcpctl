export type Server = StdioServer | SseServer;

export interface StdioServer {
  type: 'stdio';
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface SseServer {
  type: 'url';
  url: string;
}

export interface McpJson {
  mcpServers: {
    [serverName: string]: StdioServer | SseServer;
  };
}
