import { Socket } from 'net';
import { MessageReader, MessageWriter } from 'vscode-jsonrpc';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { RPCTransport, RPCTransportFactory, RPCTransportOptions } from '../transport';

export class SocketTransport implements RPCTransport {
    private _reader: MessageReader;
    private _writer: MessageWriter;
    private _socket: Socket;

    constructor(socket: Socket) {
        this._socket = socket;
        this._reader = new StreamMessageReader(socket);
        this._writer = new StreamMessageWriter(socket);
    }

    public get reader(): MessageReader {
        return this._reader;
    }

    public get writer(): MessageWriter {
        return this._writer;
    }

    dispose(): void {
        this._socket.destroy();
    }

    [Symbol.dispose](): void {
        this.dispose();
    }
}

export class SocketTransportFactory implements RPCTransportFactory {
    async create(options: RPCTransportOptions): Promise<RPCTransport> {
        if (options.type !== 'socket') {
            throw new Error('Invalid transport type. Expected "socket"');
        }
        if (!options.endpoint) {
            throw new Error('Socket endpoint is required');
        }

        const endpoint = options.endpoint;  // Type narrowing

        return new Promise((resolve, reject) => {
            const socket = new Socket();
            
            socket.on('error', (error) => {
                reject(error);
            });

            socket.connect(endpoint, () => {
                resolve(new SocketTransport(socket));
            });
        });
    }
} 