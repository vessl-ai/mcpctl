type McpServerInstallConfig = {
  type: "stdio" | "sse";
  serverName?: string;
  command: string;
  env?: Record<string, string>;
  profile?: string;
};

type McpServerConfig = {
  [serverName: string]: McpServerConfigBody;
};

enum McpServerType {
  STDIO = "stdio",
  SSE = "sse",
}

type McpServerConfigBody = {
  type?: McpServerType;
  // for stdio
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  profile?: string;

  // for sse
  url?: string;
  headers?: Record<string, string>;
};

export { McpServerConfig, McpServerConfigBody, McpServerInstallConfig, McpServerType };
