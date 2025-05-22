import { ConfigService } from '@nestjs/config';
import { bootstrapControlPlane } from '@vessl-ai/mcpctl-control-plane';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import { AppConfig } from '../config/app.config';
import { OsServiceService } from '../os-service/os-service.service';

@SubCommand({ name: 'start', description: 'Start control plane' })
export class ControlPlaneStartCommand extends CommandRunner {
  constructor(private readonly osServiceService: OsServiceService) {
    super();
  }

  async run(inputs: string[], options?: Record<string, any>): Promise<void> {
    if (options?.foreground) {
      await bootstrapControlPlane();
    } else {
      // launch as a os service
      await this.osServiceService.launchAsOsService();
    }
  }

  @Option({
    flags: '-f, --foreground',
    description: 'Foreground mode',
  })
  parseForeground(val: string) {
    return val === 'true';
  }
}

@SubCommand({ name: 'stop', description: 'Stop control plane' })
export class ControlPlaneStopCommand extends CommandRunner {
  constructor(private readonly osServiceService: OsServiceService) {
    super();
  }

  async run(): Promise<void> {
    await this.osServiceService.stopService();
  }
}

@SubCommand({ name: 'restart', description: 'Restart control plane' })
export class ControlPlaneRestartCommand extends CommandRunner {
  constructor(private readonly osServiceService: OsServiceService) {
    super();
  }

  async run(): Promise<void> {
    await this.osServiceService.stopService();
    await this.osServiceService.launchAsOsService();
  }
}

@SubCommand({ name: 'status', description: 'Get control plane status' })
export class ControlPlaneStatusCommand extends CommandRunner {
  private readonly appConfig: AppConfig;
  constructor(
    private readonly osServiceService: OsServiceService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.appConfig = this.configService.get<AppConfig>('app')!;
  }

  async run(): Promise<void> {
    // 1. os service status + 2. ask /control/status api
    const osServiceStatus = await this.osServiceService.getServiceStatus();

    const res = await fetch(
      `${this.appConfig.controlPlaneBaseUrl}/control/status`,
    );
    const data = await res.json();

    console.log(data);
  }
}

@Command({
  name: 'control-plane',
  description: 'Manage control plane',
  subCommands: [
    ControlPlaneStartCommand,
    ControlPlaneStopCommand,
    ControlPlaneRestartCommand,
    ControlPlaneStatusCommand,
  ],
})
export class ControlPlaneCommand extends CommandRunner {
  async run(): Promise<void> {
    // This is just a namespace for subcommands
  }
}
