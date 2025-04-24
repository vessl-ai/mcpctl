import fs from 'fs';
import { Server, Socket, createServer } from 'net';
import { MessageReader, MessageWriter } from 'vscode-jsonrpc';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { Logger } from '../../logger/logger';
import { RPCTransport, RPCTransportFactory, RPCTransportOptions } from '../transport';

export class SocketServerTransport implements RPCTransport {
  private _server: Server;
  private _activeSocket?: Socket;
  private _reader?: MessageReader;
  private _writer?: MessageWriter;
  private logger: Logger;

  constructor(server: Server, logger: Logger) {
    this._server = server;
    this.logger = logger.withContext('SocketServerTransport');

    this._server.on('connection', socket => {
      this.logger.debug('New socket connection received');
      // Close previous connection if exists
      if (this._activeSocket) {
        this.logger.debug('Closing previous socket connection');
        this._activeSocket.destroy();
      }

      this._activeSocket = socket;
      this._reader = new StreamMessageReader(socket);
      this._writer = new StreamMessageWriter(socket);
      this.logger.debug('Socket connection established and streams created');

      socket.on('close', () => {
        this.logger.debug('Socket connection closed');
        if (this._activeSocket === socket) {
          this._activeSocket = undefined;
          this._reader = undefined;
          this._writer = undefined;
        }
      });

      socket.on('error', error => {
        this.logger.debug('Socket error occurred', { error });
      });
    });
  }

  public get reader(): MessageReader {
    if (!this._reader) {
      const error = new Error('No active connection');
      this.logger.debug('Reader access failed', { error });
      throw error;
    }
    return this._reader;
  }

  public get writer(): MessageWriter {
    if (!this._writer) {
      const error = new Error('No active connection');
      this.logger.debug('Writer access failed', { error });
      throw error;
    }
    return this._writer;
  }

  dispose(): void {
    this.logger.debug('Disposing socket server transport');
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
  private logger: Logger;

  constructor(socket: Socket, logger: Logger) {
    this._socket = socket;
    this.logger = logger.withContext('SocketClientTransport');
    this._reader = new StreamMessageReader(socket);
    this._writer = new StreamMessageWriter(socket);
    this.logger.debug('Socket client transport initialized');

    this._socket.on('error', error => {
      this.logger.debug('Socket error occurred', { error });
    });

    this._socket.on('close', () => {
      this.logger.debug('Socket connection closed');
    });
  }

  public get reader(): MessageReader {
    return this._reader;
  }

  public get writer(): MessageWriter {
    return this._writer;
  }

  dispose(): void {
    this.logger.debug('Disposing socket client transport');
    this._socket.destroy();
  }

  [Symbol.dispose](): void {
    this.dispose();
  }
}

export class SocketTransportFactory implements RPCTransportFactory {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.withContext('SocketTransportFactory');
  }

  async create(options: RPCTransportOptions): Promise<RPCTransport> {
    this.logger.debug('Creating socket transport', { options });

    if (options.type !== 'socket') {
      const error = new Error('Invalid transport type. Expected "socket"');
      this.logger.debug('Transport creation failed', { error });
      throw error;
    }
    if (!options.endpoint) {
      const error = new Error('Socket endpoint is required');
      this.logger.debug('Transport creation failed', { error });
      throw error;
    }

    const endpoint = options.endpoint;
    const isServer = options.params?.isServer === true;

    // Server mode - create and listen on socket
    if (isServer) {
      this.logger.debug('Creating server transport', { endpoint });
      return new Promise((resolve, reject) => {
        const server = createServer();

        server.on('error', error => {
          this.logger.debug('Server creation failed', { error });
          reject(error);
        });

        // Remove existing socket file if it exists
        if (fs.existsSync(endpoint)) {
          this.logger.debug('Removing existing socket file', { endpoint });
          fs.unlinkSync(endpoint);
        }

        server.listen(endpoint, () => {
          this.logger.debug('Server listening', { endpoint });
          // 소켓 파일의 권한을 666으로 설정 (모든 사용자가 읽기/쓰기 가능)
          fs.chmodSync(endpoint, 0o666);
          resolve(new SocketServerTransport(server, this.logger));
        });
      });
    }

    // Client mode - connect to existing socket
    this.logger.debug('Creating client transport', { endpoint });
    return new Promise((resolve, reject) => {
      const socket = new Socket();

      socket.on('error', error => {
        this.logger.debug('Socket connection failed', { error });
        reject(error);
      });

      socket.connect(endpoint, () => {
        this.logger.debug('Socket connected successfully', { endpoint });
        resolve(new SocketClientTransport(socket, this.logger));
      });
    });
  }
}
