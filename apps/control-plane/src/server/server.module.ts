import { Module } from '@nestjs/common';
import { AppCacheModule } from '../cache/appcache.module';
import { SecretModule } from '../secret/secret.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

@Module({
  controllers: [ServerController],
  providers: [ServerService],
  imports: [AppCacheModule, SecretModule],
  exports: [ServerService],
})
export class ServerModule {}
