import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppCacheService } from './appcache.service';

// Mock for fs and path
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));
jest.mock('path', () => require('path-browserify'));

// Mock for existsSync
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

// Fake CacheableMemory class for instanceof check
class FakeCacheableMemory {}

// Helper to make a fake store with iterator
function makeMemoryStore(entries: Record<string, any> = {}) {
  return {
    store: new FakeCacheableMemory(),
    iterator: async function* () {
      for (const [key, value] of Object.entries(entries)) {
        yield [key, value];
      }
    },
  };
}

describe('AppCacheService (restore/backup only)', () => {
  let service: AppCacheService;
  let cacheManagerMock: any;
  let configServiceMock: any;
  let fsPromises: any;
  let fs: any;

  beforeEach(async () => {
    // Reset mocks
    jest.resetModules();
    fsPromises = require('fs/promises');
    fs = require('fs');
    fsPromises.readFile.mockReset();
    fsPromises.writeFile.mockReset();
    fsPromises.mkdir.mockReset();
    fs.existsSync.mockReset();

    // Mock cacheManager with only memory store
    cacheManagerMock = {
      stores: [makeMemoryStore({ foo: 'bar', baz: 42 })],
      set: jest.fn(),
    };
    // Mock ConfigService
    configServiceMock = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'cache') return { backupDir: '/tmp/mock-backup' };
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppCacheService,
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AppCacheService>(AppCacheService);
  });

  it('should restore cache from backup file if it exists', async () => {
    // Setup: backup file exists
    fs.existsSync.mockReturnValue(true);
    fsPromises.readFile.mockResolvedValue('{"foo":"bar","baz":42}');
    cacheManagerMock.set.mockResolvedValue(undefined);

    await service.restore();

    // Should set both keys
    expect(cacheManagerMock.set).toHaveBeenCalledWith('foo', 'bar');
    expect(cacheManagerMock.set).toHaveBeenCalledWith('baz', 42);
  });

  it('should do nothing if backup file does not exist', async () => {
    fs.existsSync.mockReturnValue(false);
    await service.restore();
    expect(cacheManagerMock.set).not.toHaveBeenCalled();
  });

  it('should save memory cache to file on backup', async () => {
    fs.existsSync.mockImplementation((p) => p === '/tmp/mock-backup');
    fsPromises.writeFile.mockResolvedValue(undefined);
    const expected = JSON.stringify({ foo: 'bar', baz: 42 }, null, 2);
    await service.backup();
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      '/tmp/mock-backup/memory-cache.json',
      expected,
    );
  });

  it('should create backup directory if it does not exist', async () => {
    fs.existsSync.mockReturnValue(false);
    fsPromises.mkdir.mockResolvedValue(undefined);
    fsPromises.writeFile.mockResolvedValue(undefined);
    await service.backup();
    expect(fsPromises.mkdir).toHaveBeenCalledWith('/tmp/mock-backup', {
      recursive: true,
    });
    expect(fsPromises.writeFile).toHaveBeenCalled();
  });
});
