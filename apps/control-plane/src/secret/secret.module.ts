import { Module } from '@nestjs/common';
import { SecretController } from './secret.controller';
import { SecretService } from './secret.service';
import { SecretStoreFactory } from './secret.store';

@Module({
  controllers: [SecretController],
  providers: [SecretService, SecretStoreFactory],
  exports: [SecretService],
})
export class SecretModule {}
