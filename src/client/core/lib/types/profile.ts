import { McpServerType } from "./mcp-server";

type Profile = {
  name: string;
  servers: {
    [key: string]: {
      type?: McpServerType;
      command?: string;
      args?: string[];
      env?: Record<string, string>;
    };
  };
};

export { Profile };
