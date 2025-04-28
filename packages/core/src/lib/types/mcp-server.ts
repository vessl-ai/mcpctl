export type McpServerInstallConfig = {
  type: "stdio" | "sse";
  serverName: string;
  command: string;
  env?: Record<string, string>;
  secrets?: Record<string, string>;
  profile?: string;
  mcpctlEnv?: Record<string, string>;
};

export type McpServerConfig = {
  [serverName: string]: McpServerConfigBody;
};

export enum McpServerType {
  STDIO = "stdio",
  SSE = "sse",
}

export type McpServerConfigBody = {
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
