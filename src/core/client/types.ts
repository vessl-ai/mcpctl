
enum ClientType {
  CLAUDE = "claude",
  CURSOR = "cursor",
}

type Client = {
  type: ClientType;
  name: string;
}

type ServerInstallConfig = {
  type: "stdio" | "sse"
  serverName?: string;
  command: string;
  env?: Record<string, string>;
  profile?: string;
}

type ServerConfig = {
  [serverName: string]: ServerConfigBody;
}

enum ServerType {
  STDIO = "stdio",
  SSE = "sse",
}

type ServerConfigBody = {
  type?: ServerType
  // for stdio
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  profile?: string;

  // for sse
  url?: string;
  headers?: Record<string, string>;
}

export { Client, ClientType, ServerConfig, ServerInstallConfig, ServerType };

