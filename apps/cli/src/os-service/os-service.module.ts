import { Module } from '@nestjs/common';
import { OsServiceService } from './os-service.service';

@Module({
  providers: [OsServiceService],
  exports: [OsServiceService],
})
export class OsServiceModule {}
