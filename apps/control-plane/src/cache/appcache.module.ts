import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheableMemory } from 'cacheable';
import { Keyv } from 'keyv';
import { AppCacheConfig } from '../config/cache.config';
import { AppCacheService } from './appcache.service';

@Module({
  providers: [AppCacheService],
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const cacheConfig = configService.get<AppCacheConfig>('cache');
        if (!cacheConfig) {
          return {};
        }
        const stores: Keyv[] = [];
        // use default in-memory store
        stores.push(
          new Keyv({
            store: new CacheableMemory({
              ttl: cacheConfig.defaultCache.ttl ?? 0,
            }),
          }),
        );
        // TODO: Add other stores defined in cacheConfig.caches
        return {
          stores,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [AppCacheService],
})
export class AppCacheModule {}
