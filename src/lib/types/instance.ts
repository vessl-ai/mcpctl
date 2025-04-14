import { RunConfig } from "./run-config";

export interface McpServerInstance {
    id: string;
    workerId: string;
    config: RunConfig;
    status: 'running' | 'stopped' | 'failed';
    startedAt: string;
    lastUsedAt: string;
    connectionInfo: {
        transport: string;
        endpoint: string;
        params?: Record<string, any>;
    };
    error?: Error;
}
