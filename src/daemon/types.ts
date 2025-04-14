import { RegistryEntry } from '../client/core/lib/types/registry';

export type DaemonCommand = 
  | { type: 'start_worker'; registryEntry: RegistryEntry; profile: string }
  | { type: 'stop_worker'; workerId: string }
  | { type: 'list_workers' }
  | { type: 'get_worker_status'; workerId: string }
  | { type: 'shutdown' };

export type DaemonResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export interface DaemonServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): Promise<boolean>;
  handleCommand(command: DaemonCommand): Promise<DaemonResponse>;
} 