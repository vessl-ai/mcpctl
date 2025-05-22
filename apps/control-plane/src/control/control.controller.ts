import { Controller, Get, Post } from '@nestjs/common';
import { ControlPlaneStatus } from '@repo/shared/types/dto/controlplane';
import { ControlService } from './control.service';

@Controller('control')
export class ControlController {
  constructor(private readonly controlService: ControlService) {}

  // Stops the control plane
  @Post('stop')
  async stop() {
    return this.controlService.stop();
  }

  // Gets the status of the control plane
  @Get('status')
  async status(): Promise<ControlPlaneStatus> {
    return this.controlService.status();
  }
}
