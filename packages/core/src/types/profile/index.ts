import { ServerEnvConfig } from "../config";
import { McpServerType } from "../server";

export interface Profile {
  name: string;
  servers: Record<
    string,
    {
      type?: McpServerType;
      command?: string;
      args?: string[];
      env?: ServerEnvConfig;
    }
  >;
}
