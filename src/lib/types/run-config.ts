export class RunConfig {
  serverName!: string;
  profileName!: string;
  command!: string;
  env?: Record<string, string>;
  created!: string;

  constructor({
    serverName,
    profileName,
    command,
    env,
    created,
  }: {
    serverName: string;
    profileName: string;
    command: string;
    env?: Record<string, string>;
    created: string;
  }) {
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
  serverName,
  profileName,
  command,
  env,
  created,
}: {
  serverName: string;
  profileName: string;
  command: string;
  env?: Record<string, string>;
  created: string;
}): RunConfig => {
  return new RunConfig({
    serverName,
    profileName,
    command,
    env,
    created,
  });
};