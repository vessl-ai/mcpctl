import * as fs from 'fs/promises';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import * as path from 'path';
import { ProfileEnv, ProfileMap } from '../types/profile';

const chalk = require('chalk');

const PROFILE_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.mcpctl',
  'profiles.json',
);

async function ensureProfileFile() {
  const dir = path.dirname(PROFILE_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.access(PROFILE_PATH);
  } catch {
    await fs.writeFile(PROFILE_PATH, '{}', 'utf-8');
  }
}

async function readProfiles(): Promise<ProfileMap> {
  await ensureProfileFile();
  const raw = await fs.readFile(PROFILE_PATH, 'utf-8');
  return JSON.parse(raw) as ProfileMap;
}

async function writeProfiles(profiles: ProfileMap) {
  await ensureProfileFile();
  await fs.writeFile(PROFILE_PATH, JSON.stringify(profiles, null, 2), 'utf-8');
}

@SubCommand({
  name: 'create',
  arguments: '<name>',
  description: 'Create a profile',
})
export class ProfileCreateCommand extends CommandRunner {
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const name = passedParams[0];
    const description = options?.description;
    const copyFrom = options?.copyFrom;
    if (!name) {
      console.error(chalk.red.bold('⛔ name is required'));
      return;
    }
    const profiles = await readProfiles();
    if (profiles[name]) {
      console.error(chalk.red.bold('⛔ Profile already exists'));
      return;
    }
    let env: ProfileEnv = {};
    if (copyFrom && profiles[copyFrom]) {
      env = { ...profiles[copyFrom].env };
    }
    profiles[name] = { description, env };
    await writeProfiles(profiles);
    console.log(chalk.green.bold('✅ Profile created: ') + chalk.cyan(name));
  }
  @Option({
    flags: '--description <text>',
    description: 'Description',
  })
  parseDescription(val: string) {
    return val;
  }
  @Option({
    flags: '--copy-from <name>',
    description: 'Copy from profile',
  })
  parseCopyFrom(val: string) {
    return val;
  }
}

@SubCommand({
  name: 'delete',
  aliases: ['rm', 'remove'],
  arguments: '<name>',
  description: 'Delete a profile',
})
export class ProfileDeleteCommand extends CommandRunner {
  async run(passedParams: string[]): Promise<void> {
    const name = passedParams[0];
    if (!name) {
      console.error(chalk.red.bold('⛔ name is required'));
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[name]) {
      console.error(chalk.red.bold('⛔ Profile not found'));
      return;
    }
    delete profiles[name];
    await writeProfiles(profiles);
    console.log(chalk.green.bold('🗑️  Profile deleted: ') + chalk.cyan(name));
  }
}

@SubCommand({
  name: 'list',
  aliases: ['ls'],
  description: 'List profiles',
})
export class ProfileListCommand extends CommandRunner {
  async run(): Promise<void> {
    const profiles = await readProfiles();
    if (Object.keys(profiles).length === 0) {
      console.log(chalk.yellow('No profiles found.'));
      return;
    }
    console.log(chalk.yellow.bold('📋 Profiles:'));
    for (const [name, value] of Object.entries(profiles)) {
      const description = (value as any).description;
      console.log(
        chalk.cyan('• ') +
          chalk.bold(name) +
          (description ? chalk.gray(' — ' + description) : ''),
      );
    }
  }
}

@SubCommand({ name: 'use', arguments: '<name>', description: 'Use a profile' })
export class ProfileUseCommand extends CommandRunner {
  async run(passedParams: string[]): Promise<void> {
    const name = passedParams[0];
    if (!name) {
      console.error(chalk.red.bold('⛔ name is required'));
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[name]) {
      console.error(chalk.red.bold('⛔ Profile not found'));
      return;
    }
    // Save current profile name to a file
    const currentPath = path.join(
      path.dirname(PROFILE_PATH),
      'current_profile',
    );
    await fs.writeFile(currentPath, name, 'utf-8');
    console.log(
      chalk.green.bold('👉 Current profile set: ') + chalk.cyan(name),
    );
  }
}

@SubCommand({
  name: 'set',
  arguments: '<key> <value>',
  description: 'Set env variable',
})
export class ProfileEnvSetCommand extends CommandRunner {
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const key = passedParams[0];
    const value = passedParams[1];
    let profile = options?.profile;
    if (!profile) {
      // Try to read current_profile file
      const currentPath = path.join(
        path.dirname(PROFILE_PATH),
        'current_profile',
      );
      try {
        profile = (await fs.readFile(currentPath, 'utf-8')).trim();
      } catch {
        // ignore
      }
    }
    if (!key || !value || !profile) {
      console.error(chalk.red.bold('⛔ key, value, --profile are required'));
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[profile]) {
      console.error(chalk.red.bold('⛔ Profile not found'));
      return;
    }
    profiles[profile].env = profiles[profile].env || {};
    profiles[profile].env[key] = value;
    await writeProfiles(profiles);
    console.log(
      chalk.green('✅ Env variable set: ') +
        chalk.cyan(key) +
        chalk.gray(' = ') +
        chalk.whiteBright(value),
    );
  }
  @Option({
    flags: '--profile <name>',
    description: 'Profile name',
  })
  parseProfile(val: string) {
    return val;
  }
}

@SubCommand({
  name: 'get',
  arguments: '<key>',
  description: 'Get env variable',
})
export class ProfileEnvGetCommand extends CommandRunner {
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const key = passedParams[0];
    let profile = options?.profile;
    if (!profile) {
      // Try to read current_profile file
      const currentPath = path.join(
        path.dirname(PROFILE_PATH),
        'current_profile',
      );
      try {
        profile = (await fs.readFile(currentPath, 'utf-8')).trim();
      } catch {
        // ignore
      }
    }
    if (!key || !profile) {
      console.error(chalk.red.bold('⛔ key, --profile are required'));
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[profile]) {
      console.error(chalk.red.bold('⛔ Profile not found'));
      return;
    }
    const value = profiles[profile].env?.[key];
    if (value === undefined) {
      console.error(chalk.red.bold('⛔ Env variable not found'));
      return;
    }
    console.log(
      chalk.green('🔎 Env variable: ') +
        chalk.cyan(key) +
        chalk.gray(' = ') +
        chalk.whiteBright(value),
    );
  }
  @Option({
    flags: '--profile <name>',
    description: 'Profile name',
  })
  parseProfile(val: string) {
    return val;
  }
}

@SubCommand({ name: 'list', description: 'List env variables' })
export class ProfileEnvListCommand extends CommandRunner {
  async run(options?: Record<string, any>): Promise<void> {
    let profile = options?.profile;
    if (!profile) {
      // Try to read current_profile file
      const currentPath = path.join(
        path.dirname(PROFILE_PATH),
        'current_profile',
      );
      try {
        profile = (await fs.readFile(currentPath, 'utf-8')).trim();
      } catch {
        // ignore
      }
    }
    if (!profile) {
      console.error(chalk.red.bold('⛔ --profile is required'));
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[profile]) {
      console.error(chalk.red.bold('⛔ Profile not found'));
      return;
    }
    const env = profiles[profile].env || {};
    if (Object.keys(env).length === 0) {
      console.log(chalk.yellow('No env variables found.'));
      return;
    }
    console.log(chalk.magenta.bold('🌱 Env variables:'));
    for (const [k, v] of Object.entries(env)) {
      console.log(
        chalk.cyan(`  ${k}`) + chalk.gray(' = ') + chalk.whiteBright(v),
      );
    }
  }
  @Option({
    flags: '--profile <name>',
    description: 'Profile name',
  })
  parseProfile(val: string) {
    return val;
  }
}

@SubCommand({
  name: 'delete',
  aliases: ['rm', 'remove'],
  arguments: '<key>',
  description: 'Delete env variable',
})
export class ProfileEnvDeleteCommand extends CommandRunner {
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const key = passedParams[0];
    let profile = options?.profile;
    if (!profile) {
      // Try to read current_profile file
      const currentPath = path.join(
        path.dirname(PROFILE_PATH),
        'current_profile',
      );
      try {
        profile = (await fs.readFile(currentPath, 'utf-8')).trim();
      } catch {
        // ignore
      }
    }
    if (!key || !profile) {
      console.error(chalk.red.bold('⛔ key, --profile are required'));
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[profile]) {
      console.error(chalk.red.bold('⛔ Profile not found'));
      return;
    }
    if (!profiles[profile].env?.[key]) {
      console.error(chalk.red.bold('⛔ Env variable not found'));
      return;
    }
    delete profiles[profile].env[key];
    await writeProfiles(profiles);
    console.log(chalk.green('🗑️  Env variable deleted: ') + chalk.cyan(key));
  }
  @Option({
    flags: '--profile <name>',
    description: 'Profile name',
  })
  parseProfile(val: string) {
    return val;
  }
}

@SubCommand({
  name: 'env',
  description: 'Manage profile environment variables',
  subCommands: [
    ProfileEnvSetCommand,
    ProfileEnvGetCommand,
    ProfileEnvListCommand,
    ProfileEnvDeleteCommand,
  ],
})
export class ProfileEnvCommand extends CommandRunner {
  async run(): Promise<void> {
    // This is just a namespace for env subcommands
  }
}

@SubCommand({
  name: 'read',
  arguments: '<name>',
  description: 'Read profile details',
})
export class ProfileReadCommand extends CommandRunner {
  async run(passedParams: string[]): Promise<void> {
    const name = passedParams[0];
    if (!name) {
      console.error(chalk.red.bold('⛔ name is required'));
      return;
    }
    const profiles = await readProfiles();
    const profile = profiles[name];
    if (!profile) {
      console.error(chalk.red.bold('⛔ Profile not found'));
      return;
    }
    // Print profile details
    console.log(chalk.blueBright.bold('=============================='));
    console.log(chalk.blueBright.bold(`Profile: `) + chalk.cyan(name));
    console.log(
      chalk.blueBright('Description: ') +
        chalk.white(profile.description || chalk.gray('<none>')),
    );
    console.log(chalk.blueBright('Env:'));
    if (profile.env && Object.keys(profile.env).length > 0) {
      for (const [k, v] of Object.entries(profile.env)) {
        console.log(
          chalk.cyan(`  ${k}`) + chalk.gray(' = ') + chalk.whiteBright(v),
        );
      }
    } else {
      console.log(chalk.gray('  <no env variables>'));
    }
    console.log(chalk.blueBright.bold('=============================='));
  }
}

@Command({
  name: 'profile',
  aliases: ['prof'],
  description: 'Manage profiles',
  subCommands: [
    ProfileCreateCommand,
    ProfileDeleteCommand,
    ProfileListCommand,
    ProfileUseCommand,
    ProfileReadCommand,
    ProfileEnvCommand,
  ],
})
export class ProfileCommand extends CommandRunner {
  async run(): Promise<void> {
    // This is just a namespace for subcommands
  }
}
