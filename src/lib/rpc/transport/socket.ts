import fs from 'fs';
import { Server, Socket, createServer } from 'net';
import { MessageReader, MessageWriter } from 'vscode-jsonrpc';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { RPCTransport, RPCTransportFactory, RPCTransportOptions } from '../transport';

export class SocketServerTransport implements RPCTransport {
    private _server: Server;
    private _activeSocket?: Socket;
    private _reader?: MessageReader;
    private _writer?: MessageWriter;

    constructor(server: Server) {
        this._server = server;
        
        this._server.on('connection', (socket) => {
            // Close previous connection if exists
            if (this._activeSocket) {
                this._activeSocket.destroy();
            }
            
            this._activeSocket = socket;
            this._reader = new StreamMessageReader(socket);
            this._writer = new StreamMessageWriter(socket);
            
            socket.on('close', () => {
                if (this._activeSocket === socket) {
                    this._activeSocket = undefined;
                    this._reader = undefined;
                    this._writer = undefined;
                }
            });
        });
    }

    public get reader(): MessageReader {
        if (!this._reader) {
            throw new Error('No active connection');
        }
        return this._reader;
    }

    public get writer(): MessageWriter {
        if (!this._writer) {
            throw new Error('No active connection');
        }
        return this._writer;
    }

    dispose(): void {
        if (this._activeSocket) {
            this._activeSocket.destroy();
        }
        this._server.close();
    }

    [Symbol.dispose](): void {
        this.dispose();
    }
}

export class SocketClientTransport implements RPCTransport {
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

        const endpoint = options.endpoint;
        const isServer = options.params?.isServer === true;

        // Server mode - create and listen on socket
        if (isServer) {
            return new Promise((resolve, reject) => {
                const server = createServer();

                server.on('error', (error) => {
                    reject(error);
                });

                // Remove existing socket file if it exists
                if (fs.existsSync(endpoint)) {
                    fs.unlinkSync(endpoint);
                }

                server.listen(endpoint, () => {
                    console.log(`Server listening on ${endpoint}`);
                    resolve(new SocketServerTransport(server));
                });
            });
        }

        // Client mode - connect to existing socket
        return new Promise((resolve, reject) => {
            const socket = new Socket();
            
            socket.on('error', (error) => {
                reject(error);
            });

            socket.connect(endpoint, () => {
                resolve(new SocketClientTransport(socket));
            });
        });
    }
} 