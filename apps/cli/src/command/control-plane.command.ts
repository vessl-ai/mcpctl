import { ConfigService } from '@nestjs/config';
import { bootstrapControlPlane } from '@vessl-ai/mcpctl-control-plane';
import chalk from 'chalk';
import { execSync } from 'child_process';
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
    console.log(chalk.yellow.bold('🛠️  OS Service Status:'));
    if (typeof osServiceStatus === 'object') {
      for (const [k, v] of Object.entries(osServiceStatus)) {
        console.log(
          chalk.cyan(`  ${k}`) + chalk.gray(' : ') + chalk.whiteBright(v),
        );
      }
    } else {
      console.log(chalk.whiteBright(osServiceStatus));
    }
    const res = await fetch(
      `${this.appConfig.controlPlaneBaseUrl}/control/status`,
    );
    const data = await res.json();
    console.log(chalk.green.bold('\n🌐 Control Plane API Status:'));
    for (const [k, v] of Object.entries(data)) {
      console.log(
        chalk.cyan(`  ${k}`) + chalk.gray(' : ') + chalk.whiteBright(v),
      );
    }
  }
}

@SubCommand({ name: 'logs', description: 'Get control plane logs' })
export class ControlPlaneLogsCommand extends CommandRunner {
  private readonly appConfig: AppConfig;
  constructor(
    private readonly osServiceService: OsServiceService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.appConfig = this.configService.get<AppConfig>('app')!;
  }

  async run(inputs: string[], options?: Record<string, any>): Promise<void> {
    console.log(
      chalk.blueBright('cli inputs:'),
      chalk.whiteBright(JSON.stringify(inputs)),
    );
    console.log(
      chalk.blueBright('cli options:'),
      chalk.whiteBright(JSON.stringify(options)),
    );
    const type = options?.type || 'stdout';
    if (process.platform === 'linux') {
      // parse journalctl
      console.log(chalk.yellow('Retrieving logs from journalctl...'));
      const logs = execSync(`journalctl -u mcpctl-control-plane -f`);
      console.log(chalk.gray(logs.toString()));
    } else {
      const logPath = this.appConfig.controlPlaneLogPath + `/${type}.log`;
      console.log(
        chalk.yellow('Opening log file with less (or cat):'),
        chalk.cyan(logPath),
      );
      const { spawnSync } = require('child_process');
      const viewer = process.env.PAGER || 'less';
      const result = spawnSync(viewer, [logPath], { stdio: 'inherit' });
      if (result.error) {
        // fallback to cat
        console.log(chalk.red('less failed, fallback to cat:'));
        spawnSync('cat', [logPath], { stdio: 'inherit' });
      }
    }
  }

  @Option({
    flags: '-t, --type <type>',
    description: 'Log type',
    defaultValue: 'stdout',
    required: false,
  })
  parseType(val: string) {
    return val;
  }
}

@Command({
  name: 'control-plane',
  aliases: ['cp'],
  description: 'Manage control plane',
  subCommands: [
    ControlPlaneStartCommand,
    ControlPlaneStopCommand,
    ControlPlaneRestartCommand,
    ControlPlaneStatusCommand,
    ControlPlaneLogsCommand,
  ],
})
export class ControlPlaneCommand extends CommandRunner {
  async run(): Promise<void> {
    // This is just a namespace for subcommands
  }
}
