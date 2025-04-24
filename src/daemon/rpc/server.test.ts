import { EventEmitter } from 'events';
import { DataCallback, Disposable, MessageConnection, MessageReader, MessageWriter } from 'vscode-jsonrpc/node';
import { Logger } from '../../lib/logger/logger';
import { RPCTransport } from '../../lib/rpc/transport';
import { DaemonStatus } from '../../lib/types/daemon';
import { McpServerHostingType } from '../../lib/types/hosting';
import { McpServerInstance, McpServerInstanceStatus } from '../../lib/types/instance';
import { RunConfig } from '../../lib/types/run-config';
import { ServerInstanceManager } from '../managers/server-instance/server-instance-manager';
import { RPCServer } from './server';

// Increase Jest timeout
jest.setTimeout(30000);

class MockTransport implements RPCTransport {
  reader: MessageReader;
  writer: MessageWriter;
  dispose = jest.fn();
  private serverEmitter = new EventEmitter();
  private clientEmitter = new EventEmitter();

  constructor() {
    this.reader = {
      listen: jest.fn((callback: DataCallback): Disposable => {
        const listener = (msg: any) => callback(msg);
        this.serverEmitter.on('message', listener);
        return {
          dispose: jest.fn(() => this.serverEmitter.removeListener('message', listener)),
        };
      }),
      onError: jest.fn(() => ({ dispose: jest.fn() })),
      onClose: jest.fn(() => ({ dispose: jest.fn() })),
      onPartialMessage: jest.fn(() => ({ dispose: jest.fn() })),
      dispose: jest.fn(() => this.serverEmitter.removeAllListeners()),
    };

    this.writer = {
      write: jest.fn(msg => {
        this.clientEmitter.emit('message', msg);
        return Promise.resolve();
      }),
      onError: jest.fn(() => ({ dispose: jest.fn() })),
      onClose: jest.fn(() => ({ dispose: jest.fn() })),
      dispose: jest.fn(),
      end: jest.fn(() => Promise.resolve()),
    };
  }

  createClientTransport(): RPCTransport {
    return {
      reader: {
        listen: jest.fn((callback: DataCallback): Disposable => {
          const listener = (msg: any) => {
            callback(msg);
            return;
          };
          this.clientEmitter.on('message', listener);
          return {
            dispose: jest.fn(() => {
              this.clientEmitter.removeListener('message', listener);
              return;
            }),
          };
        }),
        onError: jest.fn(() => ({ dispose: jest.fn() })),
        onClose: jest.fn(() => ({ dispose: jest.fn() })),
        onPartialMessage: jest.fn(() => ({ dispose: jest.fn() })),
        dispose: jest.fn(() => {
          this.clientEmitter.removeAllListeners();
          return;
        }),
      },
      writer: {
        write: jest.fn(msg => {
          this.serverEmitter.emit('message', msg);
          return Promise.resolve();
        }),
        onError: jest.fn(() => ({ dispose: jest.fn() })),
        onClose: jest.fn(() => ({ dispose: jest.fn() })),
        dispose: jest.fn(),
        end: jest.fn(() => Promise.resolve()),
      },
      dispose: jest.fn(),
    };
  }
}

class MockLogger implements Logger {
  debug = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  verbose = jest.fn();
  log = jest.fn();
  withContext = jest.fn().mockReturnThis();
}

type MockRequestHandler<T = any, U = any> = jest.Mock<Promise<U>, [T]>;
type MockNotificationHandler<T = any> = jest.Mock<Promise<void>, [T]>;

interface MockRequestType {
  method: string;
}

interface MockNotificationType {
  method: string;
}

type MockRequestCall = [MockRequestType, MockRequestHandler];
type MockNotificationCall = [MockNotificationType, MockNotificationHandler];

describe('RPCServer', () => {
  let server: RPCServer;
  let transport: MockTransport;
  let instanceManager: jest.Mocked<ServerInstanceManager>;
  let logger: Logger;
  let mockConnection: jest.Mocked<MessageConnection>;
  let mockConfig: RunConfig;
  let mockInstance: McpServerInstance;

  beforeEach(() => {
    mockConfig = {
      hosting: McpServerHostingType.LOCAL,
      serverName: 'test-server',
      profileName: 'test-profile',
      command: 'test-command',
      created: new Date().toISOString(),
    };

    mockInstance = {
      id: 'test-id',
      config: mockConfig,
      status: McpServerInstanceStatus.RUNNING,
      connectionInfo: {
        transport: 'sse',
        baseUrl: 'http://localhost:8000',
        port: 8000,
        endpoint: '/test',
      },
      startedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      start: jest.fn(),
      stop: jest.fn(),
    };

    transport = new MockTransport();

    instanceManager = {
      startInstance: jest.fn().mockResolvedValue(mockInstance),
      stopInstance: jest.fn(),
      getInstance: jest.fn().mockResolvedValue(mockInstance),
      listInstances: jest.fn().mockResolvedValue([mockInstance]),
      updateInstanceStatus: jest.fn(),
    } as any;

    logger = new MockLogger();

    mockConnection = {
      onRequest: jest.fn(),
      onNotification: jest.fn(),
      listen: jest.fn(),
      dispose: jest.fn(),
    } as any;

    require('vscode-jsonrpc/node').createMessageConnection = jest.fn().mockReturnValue(mockConnection);
  });

  describe('Instance Management', () => {
    it('should handle start instance request', async () => {
      server = new RPCServer(transport, instanceManager, logger);
      server.listen();

      const onRequestCalls = mockConnection.onRequest.mock.calls as unknown as MockRequestCall[];
      const startHandler = onRequestCalls.find(call => call[0].method === 'instance/start')?.[1] as MockRequestHandler<
        { config: RunConfig },
        McpServerInstance
      >;

      expect(startHandler).toBeDefined();
      if (startHandler) {
        const result = await startHandler({ config: mockConfig });
        expect(result).toEqual(mockInstance);
        expect(instanceManager.startInstance).toHaveBeenCalledWith(mockConfig);
      }
    });

    it('should handle stop instance request', async () => {
      server = new RPCServer(transport, instanceManager, logger);
      server.listen();

      const onRequestCalls = mockConnection.onRequest.mock.calls as unknown as MockRequestCall[];
      const stopHandler = onRequestCalls.find(call => call[0].method === 'instance/stop')?.[1] as MockRequestHandler<
        { instanceId: string },
        void
      >;

      expect(stopHandler).toBeDefined();
      if (stopHandler) {
        await stopHandler({ instanceId: 'test-id' });
        expect(instanceManager.stopInstance).toHaveBeenCalledWith('test-id');
      }
    });

    it('should handle get instance request', async () => {
      server = new RPCServer(transport, instanceManager, logger);
      server.listen();

      const onRequestCalls = mockConnection.onRequest.mock.calls as unknown as MockRequestCall[];
      const getHandler = onRequestCalls.find(call => call[0].method === 'instance/get')?.[1] as MockRequestHandler<
        { instanceId: string },
        McpServerInstance
      >;

      expect(getHandler).toBeDefined();
      if (getHandler) {
        const result = await getHandler({ instanceId: 'test-id' });
        expect(result).toEqual(mockInstance);
        expect(instanceManager.getInstance).toHaveBeenCalledWith('test-id');
      }
    });

    it('should handle list instances request', async () => {
      server = new RPCServer(transport, instanceManager, logger);
      server.listen();

      const onRequestCalls = mockConnection.onRequest.mock.calls as unknown as MockRequestCall[];
      const listHandler = onRequestCalls.find(call => call[0].method === 'instance/list')?.[1] as MockRequestHandler<
        {},
        McpServerInstance[]
      >;

      expect(listHandler).toBeDefined();
      if (listHandler) {
        const result = await listHandler({});
        expect(result).toEqual([mockInstance]);
        expect(instanceManager.listInstances).toHaveBeenCalled();
      }
    });

    it('should handle instance status notifications', async () => {
      server = new RPCServer(transport, instanceManager, logger);
      server.listen();

      type StatusParams = {
        instanceId: string;
        status: { status: McpServerInstanceStatus };
      };
      const onNotificationCalls = mockConnection.onNotification.mock.calls as unknown as MockNotificationCall[];
      const statusHandler = onNotificationCalls.find(
        call => call[0].method === 'instance/status'
      )?.[1] as MockNotificationHandler<StatusParams>;

      expect(statusHandler).toBeDefined();
      if (statusHandler) {
        await statusHandler({
          instanceId: 'test-id',
          status: { status: McpServerInstanceStatus.RUNNING },
        });

        expect(instanceManager.updateInstanceStatus).toHaveBeenCalledWith('test-id', {
          status: McpServerInstanceStatus.RUNNING,
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in start instance request', async () => {
      const error = new Error('Failed to start instance');
      instanceManager.startInstance.mockRejectedValue(error);

      server = new RPCServer(transport, instanceManager, logger);
      server.listen();

      const onRequestCalls = mockConnection.onRequest.mock.calls as unknown as MockRequestCall[];
      const startHandler = onRequestCalls.find(call => call[0].method === 'instance/start')?.[1] as MockRequestHandler<
        { config: RunConfig },
        McpServerInstance
      >;

      expect(startHandler).toBeDefined();
      if (startHandler) {
        await expect(startHandler({ config: mockConfig })).rejects.toThrow(error);
      }
    });

    it('should handle connection setup errors', () => {
      const error = new Error('Connection setup failed');
      require('vscode-jsonrpc/node').createMessageConnection.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        server = new RPCServer(transport, instanceManager, logger);
        server.listen();
      }).toThrow(error);

      expect(logger.error).toHaveBeenCalledWith('Failed to setup RPC connection', { error });
    });
  });

  describe('Status Management', () => {
    it('should handle daemon status request', async () => {
      const originalVersion = '0.0.1';
      jest.mock('../../../package.json', () => ({ version: originalVersion }), {
        virtual: true,
      });

      server = new RPCServer(transport, instanceManager, logger);
      server.listen();

      const onRequestCalls = mockConnection.onRequest.mock.calls as unknown as MockRequestCall[];
      const statusHandler = onRequestCalls.find(call => call[0].method === 'daemon/status')?.[1] as MockRequestHandler<
        {},
        DaemonStatus
      >;

      expect(statusHandler).toBeDefined();
      if (statusHandler) {
        const status = await statusHandler({});
        expect(status).toEqual({
          isRunning: true,
          version: originalVersion,
          uptime: expect.any(Number),
        } as DaemonStatus);
      }
    });

    it('should handle daemon shutdown request', async () => {
      const mockKill = jest.spyOn(process, 'kill').mockImplementation();

      server = new RPCServer(transport, instanceManager, logger);
      server.listen();

      const onRequestCalls = mockConnection.onRequest.mock.calls as unknown as MockRequestCall[];
      const shutdownHandler = onRequestCalls.find(
        call => call[0].method === 'daemon/shutdown'
      )?.[1] as MockRequestHandler<{}, void>;

      expect(shutdownHandler).toBeDefined();
      if (shutdownHandler) {
        await shutdownHandler({});
        expect(mockKill).toHaveBeenCalledWith(process.pid, 'SIGTERM');
      }
      mockKill.mockRestore();
    });
  });

  describe('Server Lifecycle', () => {
    it('should handle server transport connections', () => {
      const serverTransport = {
        ...transport,
        _server: {
          on: jest.fn(),
        },
      };

      server = new RPCServer(serverTransport, instanceManager, logger);
      server.listen();

      expect(serverTransport._server.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith('RPC server ready and waiting for connections');
    });

    it('should dispose server and transport', () => {
      server = new RPCServer(transport, instanceManager, logger);
      server.listen();
      server.dispose();

      expect(mockConnection.dispose).toHaveBeenCalled();
      expect(transport.dispose).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('RPC server disposed successfully');
    });
  });
});
