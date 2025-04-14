
enum McpClientType {
  CLAUDE = "claude",
  CURSOR = "cursor",
}

type McpClient = {
  type: McpClientType;
  name: string;
}


export { McpClient, McpClientType };

