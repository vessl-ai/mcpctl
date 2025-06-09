import { SseServer, StdioServer } from './mcp.json.schema';

export interface Toolset {
  name: string;
  description?: string;
  mcpServers: {
    [serverName: string]: StdioServer | SseServer;
  };
}
