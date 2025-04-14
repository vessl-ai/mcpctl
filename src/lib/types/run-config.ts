export interface RunConfig {
  id: string;
  serverName: string;
  profileName: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  created: string;
  lastUsed?: string;
}
