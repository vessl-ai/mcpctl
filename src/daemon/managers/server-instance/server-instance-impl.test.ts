import { spawn } from 'child_process';
import { getPortPromise } from 'portfinder';
import { Logger } from '../../../lib/logger/logger';
import { McpServerHostingType } from '../../../lib/types/hosting';
import { McpServerInstanceStatus } from '../../../lib/types/instance';
import { RunConfig } from '../../../lib/types/run-config';
import { BaseServerInstance, LocalServerInstance } from './server-instance-impl';

jest.mock('child_process');
jest.mock('portfinder');
jest.mock('../../../lib/logger/logger');

describe('BaseServerInstance', () => {
  let config: RunConfig;
  let logger: Logger;

  beforeEach(() => {
    config = new RunConfig({
      hosting: McpServerHostingType.LOCAL,
      serverName: 'test-server',
      profileName: 'test-profile',
      command: 'test-command',
      created: new Date().toISOString(),
    });
    logger = {
      verbose: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };
  });

  class TestServerInstance extends BaseServerInstance {
    async start(): Promise<void> {}
    async stop(): Promise<void> {}
  }

  it('should initialize with correct values', () => {
    const instance = new TestServerInstance(config, logger);

    expect(instance.id).toBeDefined();
    expect(instance.status).toBe(McpServerInstanceStatus.STARTING);
    expect(instance.config).toBe(config);
    expect(instance.connectionInfo).toEqual({
      transport: 'sse',
      endpoint: `/server-instances/${instance.id}/events`,
    });
    expect(instance.startedAt).toBeDefined();
    expect(instance.lastUsedAt).toBeDefined();
  });
});

describe('LocalServerInstance', () => {
  let config: RunConfig;
  let logger: Logger;
  let mockProcess: any;

  beforeEach(() => {
    config = new RunConfig({
      hosting: McpServerHostingType.LOCAL,
      serverName: 'test-server',
      profileName: 'test-profile',
      command: 'test-command',
      created: new Date().toISOString(),
    });
    logger = {
      verbose: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };
    mockProcess = {
      kill: jest.fn(),
      stdout: {
        on: jest.fn(),
      },
      stderr: {
        on: jest.fn(),
      },
    };
    (spawn as jest.Mock).mockReturnValue(mockProcess);
    (getPortPromise as jest.Mock).mockResolvedValue(12345);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start process successfully', async () => {
    const instance = new LocalServerInstance(config, logger);
    await instance.start();

    expect(spawn).toHaveBeenCalledWith(
      'npx',
      [
        '-y',
        'supergateway',
        '--stdio',
        config.command,
        '--port',
        '12345',
        '--baseUrl',
        'http://localhost:12345',
        '--ssePath',
        '/sse',
        '--messagePath',
        '/message'
      ]
    );
    expect(instance.status).toBe(McpServerInstanceStatus.RUNNING);
    expect(instance.connectionInfo.params).toEqual({
      port: 12345,
      baseUrl: 'http://localhost:12345',
    });
  });

  it('should handle start error', async () => {
    const error = new Error('Failed to start');
    (getPortPromise as jest.Mock).mockRejectedValue(error);

    const instance = new LocalServerInstance(config, logger);
    await expect(instance.start()).rejects.toThrow(error);

    expect(instance.status).toBe(McpServerInstanceStatus.FAILED);
    expect(instance.error).toBe(error);
  });

  it('should handle process messages', async () => {
    const instance = new LocalServerInstance(config, logger);
    await instance.start();

    const stdoutCallback = mockProcess.stdout.on.mock.calls[0][1];
    const stderrCallback = mockProcess.stderr.on.mock.calls[0][1];

    stdoutCallback('test message');
    stderrCallback('test error');

    expect(logger.debug).toHaveBeenCalledWith('Received message from worker', 'test message');
    expect(logger.error).toHaveBeenCalledWith('Received error from worker', 'test error');
  });

  it('should stop process successfully', async () => {
    const instance = new LocalServerInstance(config, logger);
    await instance.start();
    await instance.stop();

    expect(mockProcess.kill).toHaveBeenCalled();
    expect(instance.process).toBeUndefined();
    expect(instance.status).toBe(McpServerInstanceStatus.STOPPED);
  });

  it('should handle stop when process is not running', async () => {
    const instance = new LocalServerInstance(config, logger);
    await instance.stop();

    expect(instance.status).toBe(McpServerInstanceStatus.STOPPED);
  });
}); 