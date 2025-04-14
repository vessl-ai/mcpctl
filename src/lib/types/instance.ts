import { RunConfig } from "./run-config";

export enum McpServerInstanceStatus {
    STARTING = 'starting',
    RUNNING = 'running',
    STOPPED = 'stopped',
    FAILED = 'failed'
}

export type McpServerInstanceConnectionInfo = {
    transport: string;
    endpoint: string;
    params?: Record<string, any>;
}

export interface McpServerInstance {
    id: string;
    config: RunConfig;
    status: McpServerInstanceStatus;
    startedAt: string;
    lastUsedAt: string;
    connectionInfo: McpServerInstanceConnectionInfo;
    error?: Error;
}
