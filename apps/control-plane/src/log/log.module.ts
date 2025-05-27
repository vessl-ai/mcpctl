import { Module } from '@nestjs/common';
import { ServerModule } from '../server/server.module';
import { LogController } from './log.controller';
import { LogService } from './log.service';
@Module({
  controllers: [LogController],
  providers: [LogService],
  imports: [ServerModule],
})
export class LogModule {}
