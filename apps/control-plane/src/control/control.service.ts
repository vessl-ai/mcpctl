import { Injectable, Logger } from '@nestjs/common';
import { ControlPlaneStatus } from '@vessl-ai/mcpctl-shared/types/dto/controlplane';
import { ServerService } from '../server/server.service';

@Injectable()
export class ControlService {
  private readonly logger = new Logger(ControlService.name);

  constructor(private readonly serverService: ServerService) {}

  // Stops the control plane
  async stop(): Promise<void> {
    // dispose everything and kill this process
    this.logger.log('Stopping control plane...');
    this.logger.log('Disposing server...');
    this.serverService.dispose();
    this.logger.log('Control plane stopped');
    process.exit(0);
  }

  // Gets the status of the control plane
  async status(): Promise<ControlPlaneStatus> {
    return {
      status: 'running',
      version: '1.0.0',
      mcpServers: await this.serverService.listInstances(),
    };
  }
}
