import { EventEmitter } from 'events';
import { EventSource as NodeEventSource } from 'eventsource';
import fetch from 'node-fetch';
import {
  AbstractMessageReader,
  AbstractMessageWriter,
  DataCallback,
  Disposable,
  Message,
  MessageReader,
  MessageWriter,
} from 'vscode-jsonrpc';
import { Logger } from '../../logger/logger';
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
  private logger: Logger;

  constructor(
    private endpoint: string,
    logger: Logger
  ) {
    super();
    this.logger = logger.withContext('SSEClientMessageReader');
  }

  listen(callback: DataCallback): Disposable {
    this.logger.debug('Starting SSE listener', { endpoint: this.endpoint });
    this.callback = callback;

    if (typeof window !== 'undefined') {
      this.logger.debug('Creating browser EventSource');
      this.eventSource = new window.EventSource(this.endpoint);
    } else {
      this.logger.debug('Creating Node.js EventSource');
      this.eventSource = new NodeEventSource(this.endpoint);
    }

    if (this.eventSource) {
      this.eventSource.onmessage = (event: MessageEvent) => {
        if (this.callback) {
          try {
            const message = JSON.parse(event.data);
            this.logger.debug('Received SSE message', {
              messageType: message.method || 'response',
            });
            this.callback(message);
          } catch (error) {
            this.logger.debug('Failed to parse SSE message', { error });
            this.fireError(new Error('Failed to parse message: ' + error));
          }
        }
      };

      this.eventSource.onerror = (event: Event) => {
        this.logger.debug('EventSource error occurred');
        this.fireError(new Error('EventSource error'));
      };
    }

    return {
      dispose: () => {
        this.logger.debug('Disposing SSE listener');
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        this.callback = null;
      },
    };
  }

  dispose(): void {
    this.logger.debug('Disposing SSE message reader');
    if (this.eventSource) {
      this.eventSource.close();
    }
    this.eventEmitter.removeAllListeners();
  }
}

class SSEClientMessageWriter extends AbstractMessageWriter {
  private logger: Logger;

  constructor(
    private endpoint: string,
    logger: Logger
  ) {
    super();
    this.logger = logger.withContext('SSEClientMessageWriter');
  }

  async write(msg: Message): Promise<void> {
    this.logger.debug('Writing message', { messageType: msg || 'response' });
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
        this.logger.debug('Message write failed', {
          error,
          status: response.status,
        });
        this.fireError(error);
        throw error;
      }
      this.logger.debug('Message written successfully');
    } catch (error) {
      this.logger.debug('Message write failed', { error });
      this.fireError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async end(): Promise<void> {
    this.logger.debug('Ending message writer');
  }
}

export class SSEClientTransport implements RPCTransport {
  public reader: MessageReader;
  public writer: MessageWriter;
  private logger: Logger;

  constructor(readerEndpoint: string, writerEndpoint: string, logger: Logger) {
    this.logger = logger.withContext('SSEClientTransport');
    this.logger.debug('Initializing SSE client transport', {
      readerEndpoint,
      writerEndpoint,
    });
    this.reader = new SSEClientMessageReader(readerEndpoint, logger);
    this.writer = new SSEClientMessageWriter(writerEndpoint, logger);
  }

  dispose(): void {
    this.logger.debug('Disposing SSE client transport');
    this.reader.dispose();
    this.writer.dispose();
  }
}

export class SSEClientTransportFactory implements RPCTransportFactory {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.withContext('SSEClientTransportFactory');
  }

  async create(options: RPCTransportOptions): Promise<RPCTransport> {
    this.logger.debug('Creating SSE client transport', { options });

    if (options.type !== 'http') {
      const error = new Error('Invalid transport type for SSEClientTransportFactory');
      this.logger.debug('Transport creation failed', { error });
      throw error;
    }

    const baseEndpoint = options.endpoint;
    const readerEndpoint = `${baseEndpoint}/events`; // SSE endpoint
    const writerEndpoint = `${baseEndpoint}/messages`; // POST endpoint

    this.logger.debug('SSE endpoints configured', {
      readerEndpoint,
      writerEndpoint,
    });

    return new SSEClientTransport(readerEndpoint, writerEndpoint, this.logger);
  }
}
