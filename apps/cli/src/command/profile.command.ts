import * as fs from 'fs/promises';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import * as path from 'path';
import { ProfileEnv, ProfileMap } from '../types/profile';

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
      console.error('name is required');
      return;
    }
    const profiles = await readProfiles();
    if (profiles[name]) {
      console.error('Profile already exists');
      return;
    }
    let env: ProfileEnv = {};
    if (copyFrom && profiles[copyFrom]) {
      env = { ...profiles[copyFrom].env };
    }
    profiles[name] = { description, env };
    await writeProfiles(profiles);
    console.log('Profile created:', name);
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
  arguments: '<name>',
  description: 'Delete a profile',
})
export class ProfileDeleteCommand extends CommandRunner {
  async run(passedParams: string[]): Promise<void> {
    const name = passedParams[0];
    if (!name) {
      console.error('name is required');
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[name]) {
      console.error('Profile not found');
      return;
    }
    delete profiles[name];
    await writeProfiles(profiles);
    console.log('Profile deleted:', name);
  }
}

@SubCommand({ name: 'list', description: 'List profiles' })
export class ProfileListCommand extends CommandRunner {
  async run(): Promise<void> {
    const profiles = await readProfiles();
    console.log('Profiles:');
    for (const [name, value] of Object.entries(profiles)) {
      const description = (value as any).description;
      console.log(`- ${name}${description ? ': ' + description : ''}`);
    }
  }
}

@SubCommand({ name: 'use', arguments: '<name>', description: 'Use a profile' })
export class ProfileUseCommand extends CommandRunner {
  async run(passedParams: string[]): Promise<void> {
    const name = passedParams[0];
    if (!name) {
      console.error('name is required');
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[name]) {
      console.error('Profile not found');
      return;
    }
    // Save current profile name to a file
    const currentPath = path.join(
      path.dirname(PROFILE_PATH),
      'current_profile',
    );
    await fs.writeFile(currentPath, name, 'utf-8');
    console.log('Current profile set:', name);
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
      console.error('key, value, --profile are required');
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[profile]) {
      console.error('Profile not found');
      return;
    }
    profiles[profile].env = profiles[profile].env || {};
    profiles[profile].env[key] = value;
    await writeProfiles(profiles);
    console.log('Env variable set:', key);
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
      console.error('key, --profile are required');
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[profile]) {
      console.error('Profile not found');
      return;
    }
    const value = profiles[profile].env?.[key];
    if (value === undefined) {
      console.error('Env variable not found');
      return;
    }
    console.log('Env variable:', key, '=', value);
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
      console.error('--profile is required');
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[profile]) {
      console.error('Profile not found');
      return;
    }
    const env = profiles[profile].env || {};
    console.log('Env variables:');
    for (const [k, v] of Object.entries(env)) {
      console.log(`- ${k}=${v}`);
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
      console.error('key, --profile are required');
      return;
    }
    const profiles = await readProfiles();
    if (!profiles[profile]) {
      console.error('Profile not found');
      return;
    }
    if (!profiles[profile].env?.[key]) {
      console.error('Env variable not found');
      return;
    }
    delete profiles[profile].env[key];
    await writeProfiles(profiles);
    console.log('Env variable deleted:', key);
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
      console.error('name is required');
      return;
    }
    const profiles = await readProfiles();
    const profile = profiles[name];
    if (!profile) {
      console.error('Profile not found');
      return;
    }
    // Print profile details
    console.log(`Profile: ${name}`);
    console.log(`Description: ${profile.description || ''}`);
    console.log('Env:');
    for (const [k, v] of Object.entries(profile.env || {})) {
      console.log(`  ${k}=${v}`);
    }
  }
}

@Command({
  name: 'profile',
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
