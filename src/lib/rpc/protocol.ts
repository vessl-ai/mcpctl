import { NotificationType, RequestType } from 'vscode-jsonrpc';
import { McpServerInstance } from '../types/instance';
import { RunConfig } from '../types/run-config';

export namespace Instance {
    export namespace StartRequest {
        export const type = new RequestType<{
            configId: string;
            env?: Record<string, string>;
        }, McpServerInstance, void>('instance/start');
    }

    export namespace StopRequest {
        export const type = new RequestType<{
            instanceId: string;
        }, void, void>('instance/stop');
    }

    export namespace GetRequest {
        export const type = new RequestType<{
            instanceId: string;
        }, McpServerInstance | null, void>('instance/get');
    }

    export namespace ListRequest {
        export const type = new RequestType<{}, McpServerInstance[], void>('instance/list');
    }

    export namespace StatusNotification {
        export const type = new NotificationType<{
            instanceId: string;
            status: Partial<McpServerInstance>;
        }>('instance/status');
    }
}

export namespace Config {
    export namespace SaveRequest {
        export const type = new RequestType<{
            config: RunConfig;
        }, void, void>('config/save');
    }

    export namespace GetRequest {
        export const type = new RequestType<{
            configId: string;
        }, RunConfig | null, void>('config/get');
    }

    export namespace ListRequest {
        export const type = new RequestType<{}, RunConfig[], void>('config/list');
    }

    export namespace DeleteRequest {
        export const type = new RequestType<{
            configId: string;
        }, void, void>('config/delete');
    }
} 