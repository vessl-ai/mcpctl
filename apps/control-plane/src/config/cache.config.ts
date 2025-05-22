import { registerAs } from '@nestjs/config';
import * as os from 'os';
import * as path from 'path';
export interface AppCacheConfig {
  defaultCache: CacheEntryConfig;
  caches: Record<string, CacheEntryConfig>;
}

export enum CacheProvider {
  MEMORY = 'memory',
  REDIS = 'redis',
  ETCD = 'etcd',
}

export interface CacheEntryConfig {
  provider: CacheProvider;
  connectionString?: string;
  ttl?: number;
  backupDir?: string;
}

export const cacheConfiguration = registerAs<AppCacheConfig>('cache', () => ({
  defaultCache: {
    provider: CacheProvider.MEMORY,
    backupDir: path.join(os.homedir(), '.mcpctl', 'cache'),
  },
  caches: {},
}));
