import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ToolsetService } from './toolset.service';

@Module({
  providers: [ClientService, ToolsetService],
  exports: [ClientService, ToolsetService],
})
export class ClientModule {}
