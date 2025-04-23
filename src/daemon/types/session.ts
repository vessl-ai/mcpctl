import { ServerEnvConfig } from "../../client/core/lib/types/config";
import { McpServerHostingType } from "../../lib/types/hosting";

export interface SessionConfig {
  hosting: McpServerHostingType;
  serverName: string;
  profileName: string;
  command: string;
  created: string;
  env: ServerEnvConfig; // Record<string, string> 대신 ServerEnvConfig 사용
}
