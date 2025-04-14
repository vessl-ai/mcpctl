import { EventEmitter } from 'events';
import { createMessageConnection, DataCallback, Disposable, MessageConnection, MessageReader, MessageWriter } from 'vscode-jsonrpc/node';
import { Logger } from '../../lib/logger/logger';
import { Instance } from '../../lib/rpc/protocol';
import { RPCTransport } from '../../lib/rpc/transport';
import { McpServerHostingType } from '../../lib/types/hosting';
import { McpServerInstance, McpServerInstanceStatus } from '../../lib/types/instance';
import { McpClientType } from '../../lib/types/mcp-client-type';
import { RunConfig } from '../../lib/types/run-config';
import { ServerInstanceManager } from '../managers/server-instance/server-instance-manager';
import { RPCServer } from './server';

// Increase Jest timeout
jest.setTimeout(30000);

class MockTransport implements RPCTransport {
  reader: MessageReader;
  writer: MessageWriter;
  dispose: () => void;
  private serverEmitter = new EventEmitter();
  private clientEmitter = new EventEmitter();

  constructor() {
    this.reader = {
      listen: (callback: DataCallback): Disposable => {
        const listener = (msg: any) => callback(msg);
        this.serverEmitter.on('message', listener);
        return {
          dispose: () => this.serverEmitter.removeListener('message', listener)
        };
      },
      onError: () => ({ dispose: () => {} }),
      onClose: () => ({ dispose: () => {} }),
      onPartialMessage: () => ({ dispose: () => {} }),
      dispose: () => this.serverEmitter.removeAllListeners()
    };

    this.writer = {
      write: (msg) => {
        this.clientEmitter.emit('message', msg);
        return Promise.resolve();
      },
      onError: () => ({ dispose: () => {} }),
      onClose: () => ({ dispose: () => {} }),
      dispose: () => {},
      end: () => Promise.resolve()
    };

    this.dispose = () => {
      this.reader.dispose();
      this.writer.dispose();
      this.serverEmitter.removeAllListeners();
      this.clientEmitter.removeAllListeners();
    };
  }

  createClientTransport(): RPCTransport {
    return {
      reader: {
        listen: (callback: DataCallback): Disposable => {
          const listener = (msg: any) => callback(msg);
          this.clientEmitter.on('message', listener);
          return {
            dispose: () => this.clientEmitter.removeListener('message', listener)
          };
        },
        onError: () => ({ dispose: () => {} }),
        onClose: () => ({ dispose: () => {} }),
        onPartialMessage: () => ({ dispose: () => {} }),
        dispose: () => this.clientEmitter.removeAllListeners()
      },
      writer: {
        write: (msg) => {
          this.serverEmitter.emit('message', msg);
          return Promise.resolve();
        },
        onError: () => ({ dispose: () => {} }),
        onClose: () => ({ dispose: () => {} }),
        dispose: () => {},
        end: () => Promise.resolve()
      },
      dispose: () => {}
    };
  }
}

class MockLogger implements Logger {
  debug() {}
  info() {}
  warn() {}
  error() {}
  verbose() {}
  log() {}
  withContext(context: string): Logger { return this; }
}

describe('RPCServer', () => {
  let server: RPCServer;
  let transport: MockTransport;
  let instanceManager: jest.Mocked<ServerInstanceManager>;
  let clientConnection: MessageConnection;

  beforeEach(async () => {
    transport = new MockTransport();
    instanceManager = {
      startInstance: jest.fn(),
      stopInstance: jest.fn(),
      getInstance: jest.fn(),
      listInstances: jest.fn(),
      updateInstanceStatus: jest.fn(),
      validateConfig: jest.fn()
    } as unknown as jest.Mocked<ServerInstanceManager>;

    server = new RPCServer(
      transport,
      instanceManager,
      new MockLogger()
    );

    const clientTransport = transport.createClientTransport();
    clientConnection = createMessageConnection(
      clientTransport.reader,
      clientTransport.writer
    );

    server.listen();
    await new Promise(resolve => setTimeout(resolve, 100));
    clientConnection.listen();
  });

  afterEach(() => {
    server.dispose();
    clientConnection.dispose();
  });

  describe('Instance Management', () => {
    it('should handle start instance request', async () => {
      const mockConfig: RunConfig = {
        id: 'config-1',
        serverName: 'test-server',
        profileName: 'test-profile',
        command: 'test',
        env: {},
        created: new Date().toISOString(),
        hosting: McpServerHostingType.LOCAL,
        client: McpClientType.CLAUDE
      };

      const mockInstance: McpServerInstance = {
        id: 'test-id',
        status: McpServerInstanceStatus.RUNNING,
        config: mockConfig,
        startedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        connectionInfo: {
          transport: 'test',
          endpoint: 'test'
        },
        start: jest.fn(),
        stop: jest.fn()
      };

      instanceManager.startInstance.mockResolvedValue(mockInstance);

      const result = await clientConnection.sendRequest(Instance.StartRequest.type, {
        config: mockConfig,
      });

      expect(instanceManager.startInstance).toHaveBeenCalledWith(mockConfig);
      expect(result).toEqual(mockInstance);
    });

    it('should handle stop instance request', async () => {
      await clientConnection.sendRequest(Instance.StopRequest.type, {
        instanceId: 'test-id'
      });

      expect(instanceManager.stopInstance).toHaveBeenCalledWith('test-id');
    });

    it('should handle get instance request', async () => {
      const mockConfig: RunConfig = {
        id: 'config-1',
        serverName: 'test-server',
        profileName: 'test-profile',
        command: 'test',
        env: {},
        created: new Date().toISOString(),
        hosting: McpServerHostingType.LOCAL,
        client: McpClientType.CLAUDE
      };

      const mockInstance: McpServerInstance = {
        id: 'test-id',
        status: McpServerInstanceStatus.RUNNING,
        config: mockConfig,
        startedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        connectionInfo: {
          transport: 'test',
          endpoint: 'test'
        },
        start: jest.fn(),
        stop: jest.fn()
      };

      instanceManager.getInstance.mockResolvedValue(mockInstance);

      const result = await clientConnection.sendRequest(Instance.GetRequest.type, {
        instanceId: 'test-id'
      });

      expect(instanceManager.getInstance).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockInstance);
    });

    it('should handle list instances request', async () => {
      const mockConfig: RunConfig = {
        id: 'config-1',
        serverName: 'test-server',
        profileName: 'test-profile',
        command: 'test',
        env: {},
        created: new Date().toISOString(),
        hosting: McpServerHostingType.LOCAL,
        client: McpClientType.CLAUDE
      };

      const mockInstances: McpServerInstance[] = [
        {
          id: 'test-1',
          status: McpServerInstanceStatus.RUNNING,
          config: mockConfig,
          startedAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          connectionInfo: {
            transport: 'test',
            endpoint: 'test'
          },
          start: jest.fn(),
          stop: jest.fn()
        },
        {
          id: 'test-2',
          status: McpServerInstanceStatus.STOPPED,
          config: mockConfig,
          startedAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          connectionInfo: {
            transport: 'test',
            endpoint: 'test'
          },
          start: jest.fn(),
          stop: jest.fn()
        }
      ];

      instanceManager.listInstances.mockResolvedValue(mockInstances);

      const result = await clientConnection.sendRequest(Instance.ListRequest.type, {});

      expect(instanceManager.listInstances).toHaveBeenCalled();
      expect(result).toEqual(mockInstances);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in start instance request', async () => {
      const mockConfig: RunConfig = {
        id: "config-1",
        serverName: "test-server",
        profileName: "test-profile",
        command: "test",
        env: {},
        created: new Date().toISOString(),
        hosting: McpServerHostingType.LOCAL,
        client: McpClientType.CLAUDE
      };
      const error = new Error('Failed to start instance');
      instanceManager.startInstance.mockRejectedValue(error);

      await expect(
        clientConnection.sendRequest(Instance.StartRequest.type, {
          config: mockConfig
        })
      ).rejects.toThrow('Failed to start instance');
    });
  });
}); 