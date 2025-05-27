import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import { AppConfig } from '../config/app.config';

const chalk = require('chalk');

@SubCommand({
  name: 'add',
  aliases: ['set'],
  arguments: '<name>',
  description: 'Add a secret',
})
export class SecretAddCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    // Send POST request to daemon server to add a secret
    // TODO: Replace hardcoded URL with config/env if needed
    const name = passedParams[0];
    let sourceType = options?.source;
    const value = options?.value;
    if (!sourceType) {
      console.log(chalk.yellow('using default source type: keychain'));
      sourceType = 'keychain';
    }
    if (!name || !value) {
      console.error(chalk.red.bold('⛔ name, --value are required'));
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) {
        throw new Error('App config not found');
      }
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.post(`${baseUrl}/secret`, {
        sourceType,
        key: name,
        value,
      });
      // Print result
      console.log(chalk.green.bold('✅ Secret added!'));
      console.log(chalk.cyan('  name: ') + chalk.whiteBright(name));
      console.log(chalk.cyan('  source: ') + chalk.whiteBright(sourceType));
      console.log(chalk.cyan('  value: ') + chalk.whiteBright(value));
    } catch (err) {
      // Print error
      console.error(
        chalk.red.bold('⛔ Failed to add secret:'),
        chalk.red(err?.response?.data || err.message),
      );
    }
  }
  @Option({
    flags: '--source <vault|keychain|env>',
    description: 'Secret source (default: keychain)',
    required: false,
  })
  parseSource(val: string) {
    if (val !== 'vault' && val !== 'keychain' && val !== 'env') {
      console.log('using default source type: keychain');
      return 'keychain';
    }
    return val;
  }
  @Option({
    flags: '--value <ref-value>',
    description: 'Reference value',
    required: true,
  })
  parseValue(val: string) {
    return val;
  }
}

@SubCommand({ name: 'list', description: 'List secrets' })
export class SecretListCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(inputs: string[], options?: Record<string, any>): Promise<void> {
    let sourceType = options?.source;
    if (!sourceType) {
      console.log(chalk.yellow('using default source type: keychain'));
      sourceType = 'keychain';
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) {
        throw new Error('App config not found');
      }
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.get(`${baseUrl}/secret/${sourceType}`);
      const secrets = res.data;
      if (!Array.isArray(secrets) || secrets.length === 0) {
        console.log(chalk.yellow('No secrets found.'));
        return;
      }
      console.log(chalk.yellow.bold('🔐 Secret list:'));
      for (const secret of secrets) {
        if (typeof secret === 'object') {
          console.log(
            chalk.cyan('• ') +
              chalk.bold(secret.key || secret.name) +
              (secret.value
                ? chalk.gray(' = ') + chalk.whiteBright(secret.value)
                : ''),
          );
        } else {
          console.log(chalk.cyan('• ') + chalk.whiteBright(secret));
        }
      }
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to list secrets:'),
        chalk.red(err?.response?.data || err.message),
      );
    }
  }

  @Option({
    flags: '--source <vault|keychain|env>',
    description: 'Secret source',
  })
  parseSource(val: string) {
    if (val !== 'vault' && val !== 'keychain' && val !== 'env') {
      console.log('using default source type: keychain');
      return 'keychain';
    }
    return val;
  }
}

@SubCommand({ name: 'get', arguments: '<name>', description: 'Get a secret' })
export class SecretGetCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const name = passedParams[0];
    let sourceType = options?.source;
    if (!sourceType) {
      console.log(chalk.yellow('using default source type: keychain'));
      sourceType = 'keychain';
    }
    if (!name) {
      console.error(chalk.red.bold('⛔ name is required'));
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) {
        throw new Error('App config not found');
      }
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.get(`${baseUrl}/secret/${sourceType}/${name}`);
      console.log(chalk.green.bold('🔑 Secret value:'));
      if (typeof res.data === 'object') {
        for (const [k, v] of Object.entries(res.data)) {
          console.log(
            chalk.cyan(`  ${k}`) + chalk.gray(' = ') + chalk.whiteBright(v),
          );
        }
      } else {
        console.log(chalk.whiteBright(res.data));
      }
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to get secret:'),
        chalk.red(err?.response?.data || err.message),
      );
    }
  }

  @Option({
    flags: '--source <vault|keychain|env>',
    description: 'Secret source (default: keychain)',
  })
  parseSource(val: string) {
    if (val !== 'vault' && val !== 'keychain' && val !== 'env') {
      console.log('using default source type: keychain');
      return 'keychain';
    }
    return val;
  }
}

@SubCommand({
  name: 'remove',
  aliases: ['rm'],
  arguments: '<name>',
  description: 'Remove a secret',
})
export class SecretRemoveCommand extends CommandRunner {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const name = passedParams[0];
    let sourceType = options?.source;
    if (!sourceType) {
      console.log(chalk.yellow('using default source type: keychain'));
      sourceType = 'keychain';
    }
    if (!name) {
      console.error(chalk.red.bold('⛔ name is required'));
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) {
        throw new Error('App config not found');
      }
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.delete(`${baseUrl}/secret/${sourceType}/${name}`);
      console.log(chalk.green.bold('🗑️  Secret removed: ') + chalk.cyan(name));
    } catch (err) {
      console.error(
        chalk.red.bold('⛔ Failed to remove secret:'),
        chalk.red(err?.response?.data || err.message),
      );
    }
  }
  @Option({
    flags: '--source <vault|keychain|env>',
    description: 'Secret source (default: keychain)',
  })
  parseSource(val: string) {
    if (val !== 'vault' && val !== 'keychain' && val !== 'env') {
      console.log('using default source type: keychain');
      return 'keychain';
    }
    return val;
  }
}

@Command({
  name: 'secret',
  aliases: ['sec'],
  description: 'Manage secrets',
  subCommands: [
    SecretAddCommand,
    SecretListCommand,
    SecretGetCommand,
    SecretRemoveCommand,
  ],
})
export class SecretCommand extends CommandRunner {
  async run(): Promise<void> {
    // This is just a namespace for subcommands
  }
}
