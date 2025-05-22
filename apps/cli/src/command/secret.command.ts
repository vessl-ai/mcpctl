import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import { AppConfig } from '../config/app.config';

@SubCommand({ name: 'add', arguments: '<name>', description: 'Add a secret' })
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
    const sourceType = options?.source;
    const value = options?.value;
    if (!name || !sourceType || !value) {
      // TODO: Use proper CLI error handling
      console.error('name, --source, --value are required');
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
      console.log('Secret added:', res.data);
    } catch (err) {
      // Print error
      console.error(
        'Failed to add secret:',
        err?.response?.data || err.message,
      );
    }
  }
  @Option({
    flags: '--source <vault|keychain|env>',
    description: 'Secret source',
    required: true,
  })
  parseSource(val: string) {
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
      console.log('using default source type: keychain');
      sourceType = 'keychain';
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) {
        throw new Error('App config not found');
      }
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.get(`${baseUrl}/secret/${sourceType}`);
      console.log('Secret list:', res.data);
    } catch (err) {
      console.error(
        'Failed to list secrets:',
        err?.response?.data || err.message,
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
    const sourceType = options?.source;
    if (!name || !sourceType) {
      console.error('name, --source are required');
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) {
        throw new Error('App config not found');
      }
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.get(`${baseUrl}/secret/${sourceType}/${name}`);
      console.log('Secret value:', res.data);
    } catch (err) {
      console.error(
        'Failed to get secret:',
        err?.response?.data || err.message,
      );
    }
  }
}

@SubCommand({
  name: 'remove',
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
    const sourceType = options?.source;
    if (!name || !sourceType) {
      console.error('name, --source are required');
      return;
    }
    try {
      const appConfig = this.configService.get<AppConfig>('app');
      if (!appConfig) {
        throw new Error('App config not found');
      }
      const baseUrl = appConfig.controlPlaneBaseUrl;
      const res = await axios.delete(`${baseUrl}/secret/${sourceType}/${name}`);
      console.log('Secret removed:', res.data);
    } catch (err) {
      console.error(
        'Failed to remove secret:',
        err?.response?.data || err.message,
      );
    }
  }
}

@Command({
  name: 'secret',
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
