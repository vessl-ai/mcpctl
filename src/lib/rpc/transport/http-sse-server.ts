import { ServerResponse } from 'http';
import { DataCallback, Disposable, Emitter, Event, Message, MessageReader, MessageWriter, PartialMessageInfo } from 'vscode-jsonrpc';
import { RPCTransport } from '../transport';

const SSE_DATA_PREFIX = 'data: ';

export class SSEServerMessageReader implements MessageReader {
    private errorEmitter: Emitter<Error>;
    private closeEmitter: Emitter<void>;
    private partialMessageEmitter: Emitter<PartialMessageInfo>;
    private callback: DataCallback | undefined;
    private messageQueue: string[] = [];
    private isDisposed: boolean;

    constructor() {
        this.errorEmitter = new Emitter<Error>();
        this.closeEmitter = new Emitter<void>();
        this.partialMessageEmitter = new Emitter<PartialMessageInfo>();
        this.isDisposed = false;
    }

    public get onError(): Event<Error> {
        return this.errorEmitter.event;
    }

    public get onClose(): Event<void> {
        return this.closeEmitter.event;
    }

    public get onPartialMessage(): Event<PartialMessageInfo> {
        return this.partialMessageEmitter.event;
    }

    public listen(callback: DataCallback): Disposable {
        this.callback = callback;
        return {
            dispose: () => {
                this.callback = undefined;
            }
        };
    }

    public handleData(data: string): void {
        if (this.isDisposed) {
            return;
        }

        try {
            // SSE messages can consist of multiple lines
            const lines = data.split('\n');
            for (const line of lines) {
                if (line.startsWith(SSE_DATA_PREFIX)) {
                    const [, messageData] = line.split(SSE_DATA_PREFIX);
                    this.handleMessage(messageData);
                }
            }
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    private handleMessage(data: string): void {
        try {
            // Add to queue if message is incomplete
            if (this.isPartialMessage(data)) {
                this.messageQueue.push(data);
                return;
            }

            // Combine with queued messages if any exist
            if (this.messageQueue.length > 0) {
                this.messageQueue.push(data);
                data = this.messageQueue.join('');
                this.messageQueue = [];
            }

            // Parse message and invoke callback
            const message = JSON.parse(data);
            if (this.callback) {
                this.callback(message);
            }
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    private isPartialMessage(data: string): boolean {
        try {
            JSON.parse(data);
            return false;
        } catch {
            return true;
        }
    }

    private getExpectedLength(data: string): number {
        // Extract expected length from message
        // Should be implemented according to protocol specifications
        return data.length;
    }

    private getCurrentLength(): number {
        return this.messageQueue.reduce((acc, curr) => acc + curr.length, 0);
    }

    private handleError(error: Error, message?: Message, code?: number): void {
        this.errorEmitter.fire(error);
    }

    dispose(): void {
        if (!this.isDisposed) {
            this.isDisposed = true;
            this.callback = undefined;
            this.messageQueue = [];
            this.errorEmitter.dispose();
            this.closeEmitter.dispose();
            this.partialMessageEmitter.dispose();
        }
    }

    [Symbol.dispose](): void {
        this.dispose();
    }
}

export class SSEServerMessageWriter implements MessageWriter {
    private errorEmitter: Emitter<[Error, Message | undefined, number | undefined]>;
    private closeEmitter: Emitter<void>;
    private response: ServerResponse;
    private isDisposed: boolean;

    constructor(response: ServerResponse) {
        this.errorEmitter = new Emitter<[Error, Message | undefined, number | undefined]>();
        this.closeEmitter = new Emitter<void>();
        this.response = response;
        this.isDisposed = false;
    }

    public get onError(): Event<[Error, Message | undefined, number | undefined]> {
        return this.errorEmitter.event;
    }

    public get onClose(): Event<void> {
        return this.closeEmitter.event;
    }

    private handleError(error: Error, message?: Message, code?: number): void {
        this.errorEmitter.fire([error, message, code]);
    }

    write(msg: Message): Promise<void> {
        if (this.isDisposed) {
            return Promise.reject(new Error('Writer is disposed'));
        }
        const data = JSON.stringify(msg);
        this.response.write(`${SSE_DATA_PREFIX}${data}\n\n`);
        return Promise.resolve();
    }

    end(): void {
        this.response.end();
    }

    dispose(): void {
        if (!this.isDisposed) {
            this.isDisposed = true;
            this.response.end();
            this.errorEmitter.dispose();
            this.closeEmitter.dispose();
        }
    }

    [Symbol.dispose](): void {
        this.dispose();
    }
}

export class SSEServerTransport implements RPCTransport {
    private _reader: SSEServerMessageReader;
    private _writer: SSEServerMessageWriter;

    constructor(response: ServerResponse) {
        this._reader = new SSEServerMessageReader();
        this._writer = new SSEServerMessageWriter(response);
    }

    public get reader(): MessageReader {
        return this._reader;
    }

    public get writer(): MessageWriter {
        return this._writer;
    }

    dispose(): void {
        this._reader.dispose();
        this._writer.dispose();
    }

    [Symbol.dispose](): void {
        this.dispose();
    }
}

export function createSSEServerTransport(response: ServerResponse): SSEServerTransport {
    return new SSEServerTransport(response);
} 