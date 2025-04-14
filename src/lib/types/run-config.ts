import { McpServerHostingType } from "./hosting";
import { McpClientType } from "./mcp-client-type";

export class RunConfig {
  hosting!: McpServerHostingType;
  client!: McpClientType;
  serverName!: string;
  profileName!: string;
  command!: string;
  env?: Record<string, string>;
  created!: string;

  constructor({
    hosting,
    serverName,
    profileName,
    command,
    env,
    created,
  }: {
    hosting: McpServerHostingType;
    serverName: string;
    profileName: string;
    command: string;
    env?: Record<string, string>;
    created: string;
  }) {
    this.hosting = hosting;
    this.serverName = serverName;
    this.profileName = profileName;
    this.command = command;
    this.env = env;
    this.created = created;
  }

  public get id(): string {
    return `${this.serverName}-${this.profileName}-${this.command}`;
  }
}

export const newRunConfig = ({
  hosting,
  serverName,
  profileName,
  command,
  env,
  created,
}: {
  hosting: McpServerHostingType;
  serverName: string;
  profileName: string;
  command: string;
  env?: Record<string, string>;
  created: string;
}): RunConfig => {
  return new RunConfig({
    hosting,
    serverName,
    profileName,
    command,
    env,
    created,
  });
};