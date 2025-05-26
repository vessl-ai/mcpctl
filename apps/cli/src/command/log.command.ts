import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import * as path from 'path';
import { AppConfig } from '../config/app.config';

const chalk = require('chalk');

@SubCommand({
  name: 'server',
  arguments: '<server-name>',
  description: 'Get logs for a server instance',
})
export class LogServerCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const serverName = passedParams[0];
    const limit = options?.limit ? Number(options.limit) : 100;
    if (!serverName) {
      console.error(chalk.red.bold('⛔ server-name is required'));
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) throw new Error('App config not found');
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.get(
        `${baseUrl}/log/server-instance?serverName=${serverName}&limit=${limit}`,
      );
      const logs = res.data;
      if (!Array.isArray(logs) || logs.length === 0) {
        console.log(chalk.yellow('No logs found.'));
        return;
      }
      console.log(chalk.yellow.bold(`📄 Logs for ${serverName}:`));
      for (const line of logs) {
        console.log(line);
      }
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to get logs:'),
        chalk.red(
          typeof err?.response?.data === 'object'
            ? JSON.stringify(err?.response?.data, null, 2)
            : err?.response?.data || err.message,
        ),
      );
    }
  }
  @Option({
    flags: '-l, --limit <number>',
    description: 'Number of log lines',
    defaultValue: 100,
  })
  parseLimit(val: string) {
    return Number(val);
  }
}

@SubCommand({
  name: 'control-plane',
  description: 'Get logs for the control plane',
})
export class LogControlPlaneCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(inputs: string[], options?: Record<string, any>): Promise<void> {
    console.log(chalk.yellow.bold('📄 Logs for the control plane:'));

    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) throw new Error('App config not found');
    const logPath = appConfig.controlPlaneLogPath;
    const logFile = path.join(logPath, 'mcpctl.log');
    const logs = fs.readFileSync(logFile, 'utf8');
    console.log(logs);
  }
}

@Command({
  name: 'log',
  description: 'Manage server logs',
  subCommands: [LogServerCommand, LogControlPlaneCommand],
})
export class LogCommand extends CommandRunner {
  async run(): Promise<void> {
    // This is just a namespace for subcommands
  }
}

// registerWithSubCommands 헬퍼가 없으니, CommandModule에서 직접 LogCommand를 providers에 추가해야 한다.
