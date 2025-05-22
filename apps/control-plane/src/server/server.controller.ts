import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ServerInstance,
  ServerRunSpec,
} from '@repo/shared/types/domain/server';
import { ServerService } from './server.service';

@Controller('server')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  // Start a server
  @Post('start/')
  async startServer(
    @Body() body: { runSpec: ServerRunSpec },
  ): Promise<ServerInstance> {
    return this.serverService.start(body.runSpec);
  }

  // Stop a server
  @Post(':name/stop')
  async stopServer(@Param('name') name: string): Promise<ServerInstance> {
    return this.serverService.stopInstance(name);
  }

  // Restart a server
  @Post(':name/restart')
  async restartServer(@Param('name') name: string): Promise<ServerInstance> {
    return this.serverService.restartInstance(name);
  }

  // Get status of a server
  @Get(':name/status')
  async statusServer(
    @Param('name') name: string,
  ): Promise<ServerInstance | undefined> {
    const instance = await this.serverService.getInstanceByName(name);
    if (!instance) {
      throw new Error(`Instance ${name} not found`);
    }
    return instance;
  }

  // List all servers
  @Get('list')
  async listServers(): Promise<ServerInstance[]> {
    return this.serverService.listInstances();
  }

  // List all server run specs
  @Get('specs')
  async listServerSpecs(): Promise<ServerRunSpec[]> {
    return this.serverService.listRunSpecs();
  }

  @Get(':name')
  async getServer(
    @Param('name') name: string,
  ): Promise<ServerInstance | undefined> {
    return this.serverService.getInstanceByName(name);
  }

  @Get(':name/spec')
  async getServerSpec(
    @Param('name') name: string,
  ): Promise<ServerRunSpec | undefined> {
    return this.serverService.getRunSpecByName(name);
  }
}
