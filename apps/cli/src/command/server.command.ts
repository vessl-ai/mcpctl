import { ConfigService } from '@nestjs/config';
import {
  ServerInstance,
  ServerRunSpec,
} from '@vessl-ai/mcpctl-shared/types/domain/server';
import axios from 'axios';
import * as fs from 'fs/promises';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import { AppConfig } from '../config/app.config';
import { ProfileEnv } from '../types/profile';
import { readProfiles } from './profile.command';

const chalk = require('chalk');

@SubCommand({
  name: 'start',
  description: 'Start a server',
})
export class ServerStartCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const file = options?.file;
    const profile = options?.profile;
    if (!file) {
      console.error(chalk.red.bold('⛔ --file is required'));
      return;
    }
    let runSpec;
    try {
      runSpec = await this.loadSpec(file);
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to read spec file:'),
        chalk.red(err.message),
      );
      return;
    }
    let env: ProfileEnv = {};
    if (profile) {
      try {
        const profiles = await readProfiles();
        if (profiles[profile] && profiles[profile].env) {
          env = profiles[profile].env;
        } else {
          console.error(chalk.red.bold('⛔ Profile or env not found'));
          return;
        }
      } catch (err) {
        console.error(
          chalk.red.bold('⛔ Failed to read profile:'),
          chalk.red(err.message),
        );
        return;
      }
    }
    // merge env to spec.env
    runSpec.env = { ...runSpec.env, ...env };
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.post(`${baseUrl}/server/start`, { runSpec });
      console.log(chalk.green.bold('🚀 Server started!'));
      console.log(
        chalk.cyan('  name: ') + chalk.whiteBright(res.data?.name || 'unknown'),
      );
      if (res.data) {
        for (const [k, v] of Object.entries(res.data)) {
          if (k !== 'name') {
            // If value is object or array, pretty print as JSON
            const valueStr =
              typeof v === 'object' && v !== null
                ? JSON.stringify(v, null, 2)
                : v;
            console.log(
              chalk.cyan(`  ${k}`) +
                chalk.gray(' = ') +
                chalk.whiteBright(valueStr),
            );
          }
        }
      }
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to start server:'),
        chalk.red(
          err?.response?.data
            ? typeof err.response.data === 'object'
              ? JSON.stringify(err.response.data, null, 2)
              : err.response.data
            : err?.message || JSON.stringify(err, null, 2),
        ),
      );
    }
  }
  private async loadSpec(file: string): Promise<ServerRunSpec> {
    const raw = await fs.readFile(file, 'utf-8');
    const spec = JSON.parse(raw);

    return {
      name: spec.name,
      resourceType: spec.resourceType,
      transport: spec.transport,
      command: spec.command,
      env: spec.env,
      secrets: spec.secrets,
    };
  }
  @Option({
    flags: '-f, --file <spec-file>',
    description: 'Server spec file (JSON)',
    required: true,
  })
  parseFile(val: string) {
    return val;
  }
  @Option({
    flags: '--profile <name>',
    description: 'Profile name for env injection',
  })
  parseProfile(val: string) {
    return val;
  }
}

@SubCommand({
  name: 'stop',
  arguments: '<server-name>',
  description: 'Stop a server',
})
export class ServerStopCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(passedParams: string[]): Promise<void> {
    const serverName = passedParams[0];
    if (!serverName) {
      console.error(chalk.red.bold('⛔ server-name is required'));
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.post(`${baseUrl}/server/${serverName}/stop`);
      console.log(
        chalk.green.bold('🛑 Server stopped: ') + chalk.cyan(serverName),
      );
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to stop server:'),
        chalk.red(err?.response?.data || err.message),
      );
    }
  }
}

@SubCommand({
  name: 'restart',
  arguments: '<server-name>',
  description: 'Restart a server',
})
export class ServerRestartCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(passedParams: string[]): Promise<void> {
    const serverName = passedParams[0];
    if (!serverName) {
      console.error(chalk.red.bold('⛔ server-name is required'));
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.post(`${baseUrl}/server/${serverName}/restart`);
      console.log(
        chalk.green.bold('🔄 Server restarted: ') + chalk.cyan(serverName),
      );
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to restart server:'),
        chalk.red(err?.response?.data || err.message),
      );
    }
  }
}

@SubCommand({
  name: 'status',
  arguments: '<server-name>',
  description: 'Get server status',
})
export class ServerStatusCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(passedParams: string[]): Promise<void> {
    const serverName = passedParams[0];
    if (!serverName) {
      console.error(chalk.red.bold('⛔ server-name is required'));
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.get<ServerInstance>(
        `${baseUrl}/server/${serverName}/status`,
      );
      console.log(
        chalk.yellow.bold('📊 Server status: ') + chalk.cyan(serverName),
      );
      if (res.data && typeof res.data === 'object') {
        for (const [k, v] of Object.entries(res.data)) {
          if (k !== 'name') {
            // If value is object or array, pretty print as JSON
            const valueStr =
              typeof v === 'object' && v !== null
                ? JSON.stringify(v, null, 2)
                : v;
            console.log(
              chalk.cyan(`  ${k}`) +
                chalk.gray(' = ') +
                chalk.whiteBright(valueStr),
            );
          }
        }
      } else {
        console.log(chalk.whiteBright(res.data));
      }
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to get server status:'),
        chalk.red(err?.response?.data || err.message),
      );
    }
  }
}

@SubCommand({
  name: 'list',
  aliases: ['ls'],
  description: 'List servers',
})
export class ServerListCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(): Promise<void> {
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.get<ServerInstance[]>(`${baseUrl}/server/list`);
      const servers = res.data;
      if (!Array.isArray(servers) || servers.length === 0) {
        console.log(chalk.yellow('No servers found.'));
        return;
      }
      console.log(chalk.yellow.bold('🖥️  Server list:'));
      for (const server of servers) {
        if (typeof server === 'object') {
          console.log(
            chalk.cyan('• ') +
              chalk.bold(server.name || 'unknown') +
              (server.status
                ? chalk.gray(' — ') + chalk.whiteBright(server.status)
                : ''),
          );
        } else {
          console.log(chalk.cyan('• ') + chalk.whiteBright(server));
        }
      }
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to list servers:'),
        chalk.red(err?.response?.data || err.message),
      );
    }
  }
}

@SubCommand({
  name: 'remove',
  arguments: '<server-name>',
  aliases: ['rm'],
  description: 'Remove a server',
})
export class ServerRemoveCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(passedParams: string[]): Promise<void> {
    const serverName = passedParams[0];
    if (!serverName) {
      console.error(chalk.red.bold('⛔ server-name is required'));
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.post(`${baseUrl}/server/${serverName}/remove`);
      console.log(
        chalk.green.bold('🗑️ Server removed: ') + chalk.cyan(serverName),
      );
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to remove server:'),
        chalk.red(
          err?.response?.data
            ? typeof err.response.data === 'object'
              ? JSON.stringify(err.response.data, null, 2)
              : err.response.data
            : err?.message || JSON.stringify(err, null, 2),
        ),
      );
    }
  }
}

@Command({
  name: 'server',
  aliases: ['svr'],
  description: 'Manage servers',
  subCommands: [
    ServerStartCommand,
    ServerStopCommand,
    ServerRestartCommand,
    ServerStatusCommand,
    ServerListCommand,
    ServerRemoveCommand,
  ],
})
export class ServerCommand extends CommandRunner {
  async run(): Promise<void> {
    // This is just a namespace for subcommands
  }
}
