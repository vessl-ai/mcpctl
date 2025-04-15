import { McpServerHostingType } from "./hosting";

export interface RunConfig {
  hosting: McpServerHostingType;
  serverName: string;
  profileName: string;
  command: string;
  env?: Record<string, string>;
  created: string;
}

export const getRunConfigId = (config: RunConfig): string => {
  return `${config.serverName}-${config.profileName}-${config.command}`;
};
