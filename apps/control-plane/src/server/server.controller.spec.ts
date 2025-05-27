import { Test, TestingModule } from '@nestjs/testing';
import { TransportType } from '@repo/shared/types/common/transport';
import { ServerRunSpec } from '@repo/shared/types/domain/server';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

// Mock ServerService
const mockServerService = {
  start: jest.fn(),
  stopInstance: jest.fn(),
  restartInstance: jest.fn(),
  getInstanceByName: jest.fn(),
  listInstances: jest.fn(),
  listRunSpecs: jest.fn(),
  getRunSpecByName: jest.fn(),
};

describe('ServerController', () => {
  let controller: ServerController;
  let service: typeof mockServerService;

  const runSpec: ServerRunSpec = {
    id: 'mock-id',
    name: 'test-server',
    resourceType: 'local',
    transport: { type: TransportType.Stdio, port: 5555 },
    command: 'echo hello',
    env: {},
  };

  beforeEach(async () => {
    for (const key of Object.keys(mockServerService)) {
      // @ts-ignore
      mockServerService[key].mockReset && mockServerService[key].mockReset();
    }
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerController],
      providers: [{ provide: ServerService, useValue: mockServerService }],
    }).compile();
    controller = module.get<ServerController>(ServerController);
    service = module.get(ServerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call startServer and return result', async () => {
    service.start.mockResolvedValue({ id: 'mock-id' });
    const result = await controller.startServer({ runSpec });
    expect(service.start).toHaveBeenCalledWith(runSpec);
    expect(result).toEqual({ id: 'mock-id' });
  });

  it('should call stopServer and return result', async () => {
    service.stopInstance.mockResolvedValue({ id: 'mock-id' });
    const result = await controller.stopServer('test-server');
    expect(service.stopInstance).toHaveBeenCalledWith('test-server');
    expect(result).toEqual({ id: 'mock-id' });
  });

  it('should call restartServer and return result', async () => {
    service.restartInstance.mockResolvedValue({ id: 'mock-id' });
    const result = await controller.restartServer('test-server');
    expect(service.restartInstance).toHaveBeenCalledWith('test-server');
    expect(result).toEqual({ id: 'mock-id' });
  });

  it('should call statusServer and return status', async () => {
    service.getInstanceByName.mockResolvedValue({ status: 'running' });
    const result = await controller.statusServer('test-server');
    expect(service.getInstanceByName).toHaveBeenCalledWith('test-server');
    expect(result).toBe('running');
  });

  it('should throw if statusServer instance not found', async () => {
    service.getInstanceByName.mockResolvedValue(undefined);
    await expect(controller.statusServer('not-exist')).rejects.toThrow(
      'Instance not-exist not found',
    );
  });

  it('should call listServers and return result', async () => {
    service.listInstances.mockResolvedValue([{ id: 'mock-id' }]);
    const result = await controller.listServers();
    expect(service.listInstances).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'mock-id' }]);
  });

  it('should call listServerSpecs and return result', async () => {
    service.listRunSpecs.mockResolvedValue([{ id: 'mock-id' }]);
    const result = await controller.listServerSpecs();
    expect(service.listRunSpecs).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'mock-id' }]);
  });

  it('should call getServer and return result', async () => {
    service.getInstanceByName.mockResolvedValue({ id: 'mock-id' });
    const result = await controller.getServer('test-server');
    expect(service.getInstanceByName).toHaveBeenCalledWith('test-server');
    expect(result).toEqual({ id: 'mock-id' });
  });

  it('should call getServerSpec and return result', async () => {
    service.getRunSpecByName.mockResolvedValue({ id: 'mock-id' });
    const result = await controller.getServerSpec('test-server');
    expect(service.getRunSpecByName).toHaveBeenCalledWith('test-server');
    expect(result).toEqual({ id: 'mock-id' });
  });
});
