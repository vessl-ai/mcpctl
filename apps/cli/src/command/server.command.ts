import { ConfigService } from '@nestjs/config';
import {
  ServerInstance,
  ServerRunSpec,
} from '@repo/shared/types/domain/server';
import axios from 'axios';
import * as fs from 'fs/promises';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import * as path from 'path';
import { AppConfig } from '../config/app.config';
import { ProfileEnv, ProfileMap } from '../types/profile';
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
      console.error('--file is required');
      return;
    }
    let runSpec;
    try {
      runSpec = await this.loadSpec(file);
    } catch (err) {
      console.error('Failed to read spec file:', err.message);
      return;
    }
    let env: ProfileEnv = {};
    if (profile) {
      // Load env from profile
      const PROFILE_PATH = path.join(
        process.env.HOME || process.env.USERPROFILE || '.',
        '.mcpctl',
        'profiles.json',
      );
      try {
        const profilesRaw = await fs.readFile(PROFILE_PATH, 'utf-8');
        const profiles: ProfileMap = JSON.parse(profilesRaw);
        if (profiles[profile] && profiles[profile].env) {
          env = profiles[profile].env;
        } else {
          console.error('Profile or env not found');
          return;
        }
      } catch (err) {
        console.error('Failed to read profile:', err.message);
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
      console.log('Server started:', res.data);
    } catch (err) {
      console.error(
        'Failed to start server:',
        err?.response?.data || err.message,
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
      console.error('server-name is required');
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.post(`${baseUrl}/server/${serverName}/stop`);
      console.log('Server stopped:', res.data);
    } catch (err) {
      console.error(
        'Failed to stop server:',
        err?.response?.data || err.message,
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
      console.error('server-name is required');
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.post(`${baseUrl}/server/${serverName}/restart`);
      console.log('Server restarted:', res.data);
    } catch (err) {
      console.error(
        'Failed to restart server:',
        err?.response?.data || err.message,
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
      console.error('server-name is required');
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.get<ServerInstance>(
        `${baseUrl}/server/${serverName}/status`,
      );
      console.log('Server status:', res.data);
    } catch (err) {
      console.error(
        'Failed to get server status:',
        err?.response?.data || err.message,
      );
    }
  }
}

@SubCommand({ name: 'list', description: 'List servers' })
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
      console.log('Server list:', res.data);
    } catch (err) {
      console.error(
        'Failed to list servers:',
        err?.response?.data || err.message,
      );
    }
  }
}

@Command({
  name: 'server',
  description: 'Manage servers',
  subCommands: [
    ServerStartCommand,
    ServerStopCommand,
    ServerRestartCommand,
    ServerStatusCommand,
    ServerListCommand,
  ],
})
export class ServerCommand extends CommandRunner {
  async run(): Promise<void> {
    // This is just a namespace for subcommands
  }
}
