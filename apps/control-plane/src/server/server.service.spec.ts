import { Test, TestingModule } from '@nestjs/testing';
import { TransportType } from '@repo/shared/types/common/transport';
import { ServerRunSpec } from '@repo/shared/types/domain/server';
import { ServerService } from './server.service';

// Mock for child_process.spawn
jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({ pid: 1234 })),
}));

// Mock for findFreePort
jest.mock('../util/network', () => ({
  findFreePort: jest.fn(async () => 5555),
}));

// Mock for generateServerInstanceId
jest.mock('@repo/shared/util', () => ({
  generateServerInstanceId: jest.fn(() => 'server_instance_mockid'),
  generateServerRunSpecId: jest.fn(() => 'server_runspec_mockid'),
}));

describe('ServerService', () => {
  let service: ServerService;
  let cacheMock: any;

  // Minimal ServerRunSpec mock
  const runSpec: ServerRunSpec = {
    id: 'server_runspec_mockid',
    name: 'test-server',
    resourceType: 'local',
    transport: { type: TransportType.Stdio, port: 5555 },
    command: 'echo hello',
    env: {},
  };

  beforeEach(async () => {
    // Simple in-memory cache mock
    const cacheStore: Record<string, any> = {
      'server:run_spec': [],
      'server:instance': [],
    };
    cacheMock = {
      get: jest.fn((key) => Promise.resolve(cacheStore[key] || [])),
      set: jest.fn((key, value) => {
        cacheStore[key] = value;
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerService],
    }).compile();

    service = module.get<ServerService>(ServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start a server and update cache', async () => {
    await expect(service.start(runSpec)).resolves.toMatchObject({
      name: 'test-server',
      transport: TransportType.Stdio,
      processId: 1234,
      port: 5555,
    });
    // Check cache set calls
    expect(cacheMock.set).toHaveBeenCalled();
  });

  it('should stopInstance throw if not found', async () => {
    await expect(service.stopInstance('not-exist')).rejects.toThrow(
      'Instance not-exist not found',
    );
  });

  it('should stopInstance update status', async () => {
    // First, start a server to populate cache
    await service.start(runSpec);
    // Now, stop it
    await expect(service.stopInstance('test-server')).resolves.toMatchObject({
      name: 'test-server',
      status: 'stopped',
    });
  });

  it('should restartInstance call stop and start', async () => {
    await service.start(runSpec);
    await expect(service.restartInstance('test-server')).resolves.toMatchObject(
      {
        name: 'test-server',
        transport: TransportType.Stdio,
      },
    );
  });

  it('should getInstance return correct instance', async () => {
    await service.start(runSpec);
    const inst = await service.getInstanceByName('test-server');
    expect(inst).toBeDefined();
    expect(inst?.name).toBe('test-server');
  });

  it('should listInstances return all', async () => {
    await service.start(runSpec);
    const list = await service.listInstances();
    expect(Array.isArray(list)).toBe(true);
    expect(list[0].name).toBe('test-server');
  });

  it('should listRunSpecs return all', async () => {
    await service.start(runSpec);
    const list = await service.listRunSpecs();
    expect(Array.isArray(list)).toBe(true);
    expect(list[0].name).toBe('test-server');
  });
});
