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
  const base64Command = Buffer.from(config.command).toString("base64");
  return `${config.serverName}-${config.profileName}-${base64Command}`;
};
