import { Module } from '@nestjs/common';
import { ServerModule } from '../server/server.module';
import { ControlController } from './control.controller';
import { ControlService } from './control.service';

@Module({
  providers: [ControlService],
  controllers: [ControlController],
  imports: [ServerModule],
})
export class ControlModule {}
