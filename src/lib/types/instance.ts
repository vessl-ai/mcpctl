import { ChildProcess } from 'child_process';
import { RunConfig } from './run-config';

export enum McpServerInstanceStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPED = 'stopped',
  FAILED = 'failed',
}

export type McpServerInstanceConnectionInfo = {
  transport: string;
  baseUrl: string;
  port: number;
  endpoint: string;
  params?: Record<string, any>;
};

export interface McpServerInstance {
  id: string;
  config: RunConfig;
  status: McpServerInstanceStatus;
  startedAt: string;
  lastUsedAt: string;
  connectionInfo: McpServerInstanceConnectionInfo;
  error?: Error;
  process?: ChildProcess;
  containerId?: string;

  start(): Promise<void>;
  stop(): Promise<void>;
}
