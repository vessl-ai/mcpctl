import { EventEmitter } from 'events';
import { EventSource as NodeEventSource } from 'eventsource';
import fetch from 'node-fetch';
import { AbstractMessageReader, AbstractMessageWriter, DataCallback, Disposable, Message, MessageReader, MessageWriter } from 'vscode-jsonrpc';
import { RPCTransport, RPCTransportFactory, RPCTransportOptions } from '../transport';

interface MessageEvent {
    data: string;
}

interface ErrorEvent {
    error: Error;
}

// Node.js와 브라우저 환경에서 모두 사용할 수 있는 EventSource 타입
type EventSourceType = NodeEventSource | EventSource;

class SSEClientMessageReader extends AbstractMessageReader {
    private eventEmitter = new EventEmitter();
    private eventSource: EventSourceType | null = null;
    private callback: DataCallback | null = null;

    constructor(private endpoint: string) {
        super();
    }

    listen(callback: DataCallback): Disposable {
        this.callback = callback;
        
        if (typeof window !== 'undefined') {
            // 브라우저 환경
            this.eventSource = new window.EventSource(this.endpoint);
        } else {
            // Node.js 환경
            this.eventSource = new NodeEventSource(this.endpoint);
        }

        if (this.eventSource) {
            this.eventSource.onmessage = (event: MessageEvent) => {
                if (this.callback) {
                    try {
                        const message = JSON.parse(event.data);
                        this.callback(message);
                    } catch (error) {
                        this.fireError(new Error('Failed to parse message: ' + error));
                    }
                }
            };

            this.eventSource.onerror = (event: Event) => {
                this.fireError(new Error('EventSource error'));
            };
        }

        return {
            dispose: () => {
                if (this.eventSource) {
                    this.eventSource.close();
                    this.eventSource = null;
                }
                this.callback = null;
            }
        };
    }

    dispose(): void {
        if (this.eventSource) {
            this.eventSource.close();
        }
        this.eventEmitter.removeAllListeners();
    }
}

class SSEClientMessageWriter extends AbstractMessageWriter {
    constructor(private endpoint: string) {
        super();
    }

    async write(msg: Message): Promise<void> {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(msg),
            });

            if (!response.ok) {
                const error = new Error(`HTTP error! status: ${response.status}`);
                this.fireError(error);
                throw error;
            }
        } catch (error) {
            this.fireError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async end(): Promise<void> {
        // Nothing to end
    }
}

export class SSEClientTransport implements RPCTransport {
    public reader: MessageReader;
    public writer: MessageWriter;

    constructor(readerEndpoint: string, writerEndpoint: string) {
        this.reader = new SSEClientMessageReader(readerEndpoint);
        this.writer = new SSEClientMessageWriter(writerEndpoint);
    }

    dispose(): void {
        this.reader.dispose();
        this.writer.dispose();
    }
}

export class SSEClientTransportFactory implements RPCTransportFactory {
    async create(options: RPCTransportOptions): Promise<RPCTransport> {
        if (options.type !== 'http') {
            throw new Error('Invalid transport type for SSEClientTransportFactory');
        }

        const baseEndpoint = options.endpoint;
        const readerEndpoint = `${baseEndpoint}/events`; // SSE endpoint
        const writerEndpoint = `${baseEndpoint}/messages`; // POST endpoint

        return new SSEClientTransport(readerEndpoint, writerEndpoint);
    }
} 