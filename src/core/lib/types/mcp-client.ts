import { McpClientType } from "../../../lib/types/mcp-client-type";

type McpClient = {
  type: McpClientType;
  name: string;
};

export { McpClient, McpClientType };
