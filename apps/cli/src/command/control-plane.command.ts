import { ConfigService } from '@nestjs/config';
import { bootstrapControlPlane } from '@vessl-ai/mcpctl-control-plane';
import { spawn } from 'child_process';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import { AppConfig } from '../config/app.config';
import { OsServiceService } from '../os-service/os-service.service';

const chalk = require('chalk');
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
    let data: any;
    try {
      // This fetch can fail for a million stupid reasons, so let's actually handle it like a pro
      const res = await fetch(
        `${this.appConfig.controlPlaneBaseUrl}/control/status`,
      );
      if (!res.ok) {
        // If the response is not OK, don't even try to parse JSON. Just rage.
        console.log(
          chalk.red.bold(
            `\n[ERROR] Control Plane API returned status ${res.status}: ${res.statusText}`,
          ),
        );
        return;
      }
      data = await res.json();
    } catch (err: any) {
      // Of course, fetch can throw. Why wouldn't it? Let's tell the user what went wrong.
      console.log(
        chalk.red.bold('\n[ERROR] Failed to fetch Control Plane API status:'),
        chalk.whiteBright(err?.message || err),
      );
      return;
    }
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
      const logs = spawn('journalctl', ['-u', 'mcpctl-control-plane', '-f']);
      logs.stdout.on('data', (data) => {
        console.log(chalk.gray(data.toString()));
      });
      logs.stderr.on('data', (data) => {
        console.log(chalk.red(data.toString()));
      });
      logs.on('close', (code) => {
        console.log(chalk.red(`journalctl closed with code ${code}`));
      });
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
