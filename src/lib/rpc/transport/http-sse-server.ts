import { ServerResponse } from 'http';
import {
  DataCallback,
  Disposable,
  Emitter,
  Event,
  Message,
  MessageReader,
  MessageWriter,
  PartialMessageInfo,
} from 'vscode-jsonrpc';
import { Logger } from '../../logger/logger';
import { RPCTransport } from '../transport';

const SSE_DATA_PREFIX = 'data: ';

export class SSEServerMessageReader implements MessageReader {
  private errorEmitter: Emitter<Error>;
  private closeEmitter: Emitter<void>;
  private partialMessageEmitter: Emitter<PartialMessageInfo>;
  private callback: DataCallback | undefined;
  private messageQueue: string[] = [];
  private isDisposed: boolean;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.withContext('SSEServerMessageReader');
    this.errorEmitter = new Emitter<Error>();
    this.closeEmitter = new Emitter<void>();
    this.partialMessageEmitter = new Emitter<PartialMessageInfo>();
    this.isDisposed = false;
    this.logger.debug('SSE server message reader initialized');
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
    this.logger.debug('Starting message listener');
    this.callback = callback;
    return {
      dispose: () => {
        this.logger.debug('Disposing message listener');
        this.callback = undefined;
      },
    };
  }

  public handleData(data: string): void {
    if (this.isDisposed) {
      this.logger.debug('Ignoring data - reader is disposed');
      return;
    }

    try {
      this.logger.debug('Processing incoming data');
      // SSE messages can consist of multiple lines
      const lines = data.split('\n');
      for (const line of lines) {
        if (line.startsWith(SSE_DATA_PREFIX)) {
          const [, messageData] = line.split(SSE_DATA_PREFIX);
          this.handleMessage(messageData);
        }
      }
    } catch (error) {
      this.logger.debug('Error handling data', { error });
      this.handleError(error as Error);
    }
  }

  private handleMessage(data: string): void {
    try {
      // Add to queue if message is incomplete
      if (this.isPartialMessage(data)) {
        this.logger.debug('Received partial message, adding to queue');
        this.messageQueue.push(data);
        return;
      }

      // Combine with queued messages if any exist
      if (this.messageQueue.length > 0) {
        this.logger.debug('Processing queued messages', {
          queueLength: this.messageQueue.length,
        });
        this.messageQueue.push(data);
        data = this.messageQueue.join('');
        this.messageQueue = [];
      }

      // Parse message and invoke callback
      const message = JSON.parse(data);
      if (this.callback) {
        this.logger.debug('Invoking callback with parsed message');
        this.callback(message);
      }
    } catch (error) {
      this.logger.debug('Error handling message', { error });
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
    this.logger.debug('Error occurred', { error });
    this.errorEmitter.fire(error);
  }

  dispose(): void {
    if (!this.isDisposed) {
      this.logger.debug('Disposing SSE server message reader');
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
  private logger: Logger;

  constructor(response: ServerResponse, logger: Logger) {
    this.logger = logger.withContext('SSEServerMessageWriter');
    this.errorEmitter = new Emitter<[Error, Message | undefined, number | undefined]>();
    this.closeEmitter = new Emitter<void>();
    this.response = response;
    this.isDisposed = false;
    this.logger.debug('SSE server message writer initialized');
  }

  public get onError(): Event<[Error, Message | undefined, number | undefined]> {
    return this.errorEmitter.event;
  }

  public get onClose(): Event<void> {
    return this.closeEmitter.event;
  }

  private handleError(error: Error, message?: Message, code?: number): void {
    this.logger.debug('Error occurred', { error, code });
    this.errorEmitter.fire([error, message, code]);
  }

  write(msg: Message): Promise<void> {
    if (this.isDisposed) {
      const error = new Error('Writer is disposed');
      this.logger.debug('Write failed - writer is disposed');
      return Promise.reject(error);
    }
    this.logger.debug('Writing message');
    const data = JSON.stringify(msg);
    this.response.write(`${SSE_DATA_PREFIX}${data}\n\n`);
    return Promise.resolve();
  }

  end(): void {
    this.logger.debug('Ending response');
    this.response.end();
  }

  dispose(): void {
    if (!this.isDisposed) {
      this.logger.debug('Disposing SSE server message writer');
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
  private logger: Logger;

  constructor(response: ServerResponse, logger: Logger) {
    this.logger = logger.withContext('SSEServerTransport');
    this.logger.debug('Initializing SSE server transport');
    this._reader = new SSEServerMessageReader(logger);
    this._writer = new SSEServerMessageWriter(response, logger);
  }

  public get reader(): MessageReader {
    return this._reader;
  }

  public get writer(): MessageWriter {
    return this._writer;
  }

  dispose(): void {
    this.logger.debug('Disposing SSE server transport');
    this._reader.dispose();
    this._writer.dispose();
  }

  [Symbol.dispose](): void {
    this.dispose();
  }
}

export function createSSEServerTransport(response: ServerResponse, logger: Logger): SSEServerTransport {
  return new SSEServerTransport(response, logger);
}
