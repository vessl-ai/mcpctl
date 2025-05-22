import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Events } from 'cache-manager';
import { CacheableMemory, Keyv } from 'cacheable';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AppCacheConfig, CacheEntryConfig } from '../config/cache.config';

@Injectable()
export class AppCacheService {
  private readonly logger = new Logger(AppCacheService.name);
  private readonly MEMORY_CACHE_FILE = 'memory-cache.json';

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.restore();
  }

  private isOnlyMemoryStore() {
    return (
      this.cacheManager.stores.some(
        (store) => store.store instanceof CacheableMemory,
      ) && this.cacheManager.stores.length === 1
    );
  }

  async restore() {
    if (this.isOnlyMemoryStore()) {
      this.logger.log('Restoring cache...');
      const backupDir =
        this.configService.get<AppCacheConfig>('cache')?.defaultCache.backupDir;
      if (!backupDir) {
        this.logger.error('No backup directory found');
        return;
      }
      const backupPath = path.join(backupDir, this.MEMORY_CACHE_FILE);
      if (!existsSync(backupPath)) {
        this.logger.error('No backup file found');
        return;
      }
      const entries = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      for (const [key, value] of Object.entries(entries)) {
        await this.cacheManager.set(key, value);
      }
      this.logger.log('Cache restored');
    }
  }

  async backup() {
    this.logger.log('Backing up cache...');
    // if only memory store is used, backup the cache
    if (this.isOnlyMemoryStore()) {
      this.logger.log('Backing up memory cache since only it is used');
      const store = this.cacheManager.stores.filter(
        (store) => store.store instanceof CacheableMemory,
      )[0];
      if (!store) {
        this.logger.error('No memory store found');
        return;
      }
      if (!store.iterator) {
        this.logger.error('No iterator found');
        return;
      }
      const entries = {};
      for await (const [key, value] of store.iterator(undefined)) {
        entries[key] = value;
      }

      // save the entries to a file
      const backupDir =
        this.configService.get<CacheEntryConfig>('cache')?.backupDir;
      if (!backupDir) {
        this.logger.error('No backup directory found');
        return;
      }
      if (!existsSync(backupDir)) {
        await fs.mkdir(backupDir, { recursive: true });
      }
      const backupPath = path.join(backupDir, this.MEMORY_CACHE_FILE);
      await fs.writeFile(backupPath, JSON.stringify(entries, null, 2));
      this.logger.log('Memory cache backed up');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Delegate get to cacheManager
    return this.cacheManager.get<T>(key);
  }

  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    // Delegate mget to cacheManager
    return this.cacheManager.mget<T>(keys);
  }

  async ttl(key: string): Promise<number | null> {
    // Delegate ttl to cacheManager
    return this.cacheManager.ttl(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<T> {
    // Delegate set to cacheManager
    await this.cacheManager.set<T>(key, value, ttl);
    return value;
  }

  async mset<T>(
    list: Array<{ key: string; value: T; ttl?: number }>,
  ): Promise<Array<{ key: string; value: T; ttl?: number }>> {
    // Delegate mset to cacheManager
    await this.cacheManager.mset<T>(list);
    return list;
  }

  async del(key: string): Promise<boolean> {
    // Delegate del to cacheManager
    return this.cacheManager.del(key);
  }

  async mdel(keys: string[]): Promise<boolean> {
    // Delegate mdel to cacheManager
    return this.cacheManager.mdel(keys);
  }

  async clear(): Promise<boolean> {
    // Delegate clear to cacheManager
    return this.cacheManager.clear();
  }

  on<E extends keyof Events>(event: E, listener: Events[E]) {
    // Delegate on to cacheManager
    return this.cacheManager.on(event, listener);
  }

  off<E extends keyof Events>(event: E, listener: Events[E]) {
    // Delegate off to cacheManager
    return this.cacheManager.off(event, listener);
  }

  async disconnect(): Promise<undefined> {
    // Delegate disconnect to cacheManager
    return this.cacheManager.disconnect();
  }

  get cacheId(): () => string {
    // Delegate cacheId to cacheManager
    return this.cacheManager.cacheId;
  }

  get stores(): Keyv<any>[] {
    // Delegate stores to cacheManager
    return this.cacheManager.stores;
  }

  async wrap<T>(
    key: unknown,
    fnc: () => Promise<T> | T,
    ttl?: unknown,
    refreshThreshold?: unknown,
  ): Promise<T> {
    // Safely cast ttl and refreshThreshold to the correct type
    const safeTtl =
      typeof ttl === 'number' || (typeof ttl === 'function' && ttl.length === 1)
        ? (ttl as number | ((value: T) => number))
        : undefined;
    const safeRefresh =
      typeof refreshThreshold === 'number' ||
      (typeof refreshThreshold === 'function' && refreshThreshold.length === 1)
        ? (refreshThreshold as number | ((value: T) => number))
        : undefined;
    return this.cacheManager.wrap<T>(key as string, fnc, safeTtl, safeRefresh);
  }
}
