import arg from 'arg';
import { SecretReference } from '../../../core/lib/types/secret';
import { GLOBAL_CONSTANTS } from '../../../lib/constants';
import { CliError, ResourceNotFoundError, ValidationError } from '../../../lib/errors';
import { maskSecret } from '../../../lib/logger/logger';
import { App } from '../../app';

export const secretCommand = async (app: App, argv: string[]) => {
  const options = arg({}, { argv, permissive: true });
  const subcommand = options['_']?.[0];

  const logger = app.getLogger();

  switch (subcommand) {
    case 'set':
      await secretSetCommand(app, argv);
      break;
    case 'get':
      await secretGetCommand(app, argv);
      break;
    case 'remove':
      await secretRemoveCommand(app, argv);
      break;
    case 'list':
      await secretListCommand(app, argv);
      break;
    default:
      logger.error(`Unknown subcommand ${subcommand}. Available subcommands: set, get, remove, list`);
      throw new CliError(`Unknown subcommand ${subcommand}. Available subcommands: set, get, remove, list`);
  }
};

export const secretListCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      '--shared': Boolean,
      '--profile': String,
      '--server': String,
      '-p': '--profile',
      '-s': '--server',
      '-g': '--shared',
    },
    { argv }
  );

  const logger = app.getLogger();

  const profileName = options['--profile'];
  const serverName = options['--server'];
  const isShared = options['--shared'] || false;

  // 프로필과 서버가 모두 지정된 경우
  if (profileName && serverName) {
    const profile = app.getProfileService().getProfile(profileName);
    if (!profile) {
      logger.error(`Profile '${profileName}' not found`);
      throw new ResourceNotFoundError(`Profile '${profileName}' not found`);
    }

    const server = profile.servers[serverName];
    if (!server) {
      logger.error(`Server '${serverName}' not found in profile '${profileName}'`);
      throw new ResourceNotFoundError(`Server '${serverName}' not found in profile '${profileName}'`);
    }

    const secrets = server.env?.secrets || {};
    console.log(`\n🔐 Secrets for ${profileName}/${serverName}:`);
    console.log('=====================================');

    if (Object.keys(secrets).length === 0) {
      console.log('  No secrets set');
    } else {
      Object.keys(secrets).forEach(secretKey => {
        console.log(`  - ${secretKey}: ${secrets[secretKey].key} (${secrets[secretKey].description})`);
      });
    }
    return;
  }

  // 공유 시크릿이 명시적으로 요청된 경우
  if (isShared) {
    const sharedSecrets = app.getSecretService().listSharedSecrets();
    console.log('\n🔐 Shared secrets:');
    console.log('================');

    if (Object.keys(sharedSecrets).length === 0) {
      console.log('  No shared secrets set');
    } else {
      for (const [key, secret] of Object.entries(sharedSecrets)) {
        console.log(`  - ${key}: ${secret.description}`);
      }
    }
    return;
  }

  // 옵션이 지정되지 않은 경우 모든 시크릿을 보여줌
  console.log('\n📋 All Secrets');
  console.log('=============');

  // 1. 공유 시크릿 표시
  const sharedSecrets = app.getSecretService().listSharedSecrets();
  if (Object.keys(sharedSecrets).length > 0) {
    console.log('\n🔐 Shared secrets:');
    console.log('----------------');
    for (const [key, secret] of Object.entries(sharedSecrets)) {
      console.log(`  - ${key}: ${secret.description}`);
    }
  }

  // 2. 프로필별 시크릿 표시
  const profiles = app.getProfileService().listProfiles();
  for (const profile of profiles) {
    const profileName = profile.name;
    for (const [serverName, server] of Object.entries(profile.servers)) {
      const secrets = server.env?.secrets;
      if (secrets && Object.keys(secrets).length > 0) {
        console.log(`\n🔐 ${profileName}/${serverName}:`);
        console.log('-'.repeat(profileName.length + serverName.length + 4));
        Object.keys(secrets).forEach(secretKey => {
          console.log(`  - ${secretKey}: ${secrets[secretKey].key} (${secrets[secretKey].description})`);
        });
      }
    }
  }
};

export const secretSetCommand = async (app: App, argv: string[]) => {
  // TODO: add scheme in the beginning of the refs that represents secret store type
  const options = arg(
    {
      '--shared': Boolean,
      '--profile': String,
      '--server': String,
      '--entry': [String],
      '-p': '--profile',
      '-s': '--server',
      '-e': '--entry',
      '-g': '--shared',
    },
    { argv }
  );

  const logger = app.getLogger();

  const profileName = options['--profile'];
  const serverName = options['--server'];
  const entry = options['--entry'];
  const isShared = options['--shared'] || false;

  // 프로필 모드와 공유 모드 동시 사용 방지
  if (isShared && (profileName || serverName)) {
    logger.error('Error: Cannot use --shared with --profile or --server');
    throw new ValidationError('Cannot use --shared with --profile or --server');
  }

  if (!entry) {
    throw new ValidationError('Secret key value is required');
  }

  // 프로필 모드 검증
  if (!isShared) {
    if (!profileName) {
      logger.error('Error: Profile name is required (--profile, -p) when not using --shared');
      throw new ValidationError('Profile name is required');
    }

    if (!serverName) {
      logger.error('Error: Server name is required (--server, -s) when not using --shared');
      throw new ValidationError('Server name is required');
    }

    const profile = app.getProfileService().getProfile(profileName);
    if (!profile) {
      throw new ResourceNotFoundError(`Profile '${profileName}' not found`);
    }

    const server = profile.servers[serverName];
    if (!server) {
      throw new ResourceNotFoundError(`Server '${serverName}' not found in profile '${profileName}'`);
    }
  }

  const secrets = Object.fromEntries(entry.map(e => e.split('=')));

  try {
    if (isShared) {
      // 공유 시크릿 설정
      await app.getSecretService().setSharedSecrets(secrets);
      console.log('✅ Shared secret updated successfully!');
    } else {
      // 프로필별 시크릿 설정
      await app.getProfileService().upsertProfileSecretsForServer(profileName!, serverName!, secrets);
      console.log(`✅ Secret updated successfully for ${profileName}/${serverName}!`);
    }

    console.log('\nUpdated secret:');
    for (const [key, value] of Object.entries(secrets)) {
      console.log(
        maskSecret(`  - ${key}: ${GLOBAL_CONSTANTS.SECRET_TAG_START}${value}${GLOBAL_CONSTANTS.SECRET_TAG_END}`)
      );
    }
  } catch (error) {
    logger.error('❌ Failed to update secret:', { error });
    throw new CliError('Failed to update secret', error);
  }
};

export const secretGetCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      '--profile': String,
      '--server': String,
      '--key': String,
      '--shared': Boolean,
      '-p': '--profile',
      '-s': '--server',
      '-k': '--key',
      '-g': '--shared',
    },
    { argv }
  );

  const logger = app.getLogger();

  const profileName = options['--profile'];
  const serverName = options['--server'];
  const key = options['--key'];
  const isShared = options['--shared'] || false;

  // 프로필 모드와 공유 모드 동시 사용 방지
  if (isShared && (profileName || serverName)) {
    logger.error('Error: Cannot use --shared with --profile or --server');
    throw new ValidationError('Cannot use --shared with --profile or --server');
  }

  // 프로필 모드 검증
  if (!isShared) {
    if (!profileName) {
      logger.error('Error: Profile name is required (--profile, -p) when not using --shared');
      throw new ValidationError('Profile name is required');
    }

    if (!serverName) {
      logger.error('Error: Server name is required (--server, -s) when not using --shared');
      throw new ValidationError('Server name is required');
    }
  }

  try {
    if (isShared) {
      // 공유 시크릿 조회
      const sharedSecrets = app.getSecretService().listSharedSecrets();

      console.log('\n🔐 Shared secrets:');
      console.log('================');

      if (key) {
        // 특정 시크릿만 조회
        const value = await app.getSecretService().getSharedSecret(key);
        if (value === null) {
          logger.error(`Secret '${key}' not found`);
          throw new ResourceNotFoundError(`Secret '${key}' not found`);
        }
        console.log(`  - ${key}: ${GLOBAL_CONSTANTS.SECRET_TAG_START}${value}${GLOBAL_CONSTANTS.SECRET_TAG_END}`);
      } else {
        // 모든 시크릿 조회
        if (Object.keys(sharedSecrets).length === 0) {
          console.log('  No shared secrets set');
        } else {
          for (const [secretKey, secret] of Object.entries(sharedSecrets)) {
            const value = await app.getSecretService().getSharedSecret(secretKey);
            console.log(
              `  - ${secretKey}: ${GLOBAL_CONSTANTS.SECRET_TAG_START}${value}${GLOBAL_CONSTANTS.SECRET_TAG_END}`
            );
            if (secret.description) {
              console.log(`    Description: ${secret.description}`);
            }
          }
        }
      }
    } else {
      // 프로필별 시크릿 조회
      const profile = app.getProfileService().getProfile(profileName!);
      if (!profile) {
        logger.error(`Profile '${profileName}' not found`);
        throw new ResourceNotFoundError(`Profile '${profileName}' not found`);
      }

      const server = profile.servers[serverName!];
      if (!server) {
        logger.error(`Server '${serverName}' not found in profile '${profileName}'`);
        throw new ResourceNotFoundError(`Server '${serverName}' not found in profile '${profileName}'`);
      }

      const secrets = server.env?.secrets || {};

      console.log(`\n🔐 Secrets for ${profileName}/${serverName}:`);
      console.log('=====================================');

      if (key) {
        // 특정 시크릿만 조회
        if (!secrets[key]) {
          logger.error(`Secret '${key}' not found`);
          throw new ResourceNotFoundError(`Secret '${key}' not found`);
        }
        console.log(
          `  - ${key}: ${GLOBAL_CONSTANTS.SECRET_TAG_START}${secrets[key]}${GLOBAL_CONSTANTS.SECRET_TAG_END}`
        );
      } else {
        // 모든 시크릿 조회
        if (Object.keys(secrets).length === 0) {
          console.log('  No secrets set');
        } else {
          Object.keys(secrets).forEach(secretKey => {
            console.log(
              `  - ${secretKey}: ${GLOBAL_CONSTANTS.SECRET_TAG_START}${secrets[secretKey]}${GLOBAL_CONSTANTS.SECRET_TAG_END}`
            );
          });
        }
      }
    }
  } catch (error) {
    logger.error('❌ Error:', { error });
    throw new CliError('Failed to get secret');
  }
};

export const secretRemoveCommand = async (app: App, argv: string[]) => {
  const options = arg(
    {
      '--profile': String,
      '--server': String,
      '--key': String,
      '--shared': Boolean,
      '-p': '--profile',
      '-s': '--server',
      '-k': '--key',
      '-g': '--shared',
    },
    { argv }
  );

  const logger = app.getLogger();

  const profileName = options['--profile'];
  const serverName = options['--server'];
  const key = options['--key'];
  const isShared = options['--shared'] || false;

  // 프로필 모드와 공유 모드 동시 사용 방지
  if (isShared && (profileName || serverName)) {
    logger.error('Error: Cannot use --shared with --profile or --server');
    throw new ValidationError('Cannot use --shared with --profile or --server');
  }

  // 프로필 모드 검증
  if (!isShared) {
    if (!profileName) {
      logger.error('Error: Profile name is required (--profile, -p) when not using --shared');
      throw new ValidationError('Profile name is required');
    }

    if (!serverName) {
      logger.error('Error: Server name is required (--server, -s) when not using --shared');
      throw new ValidationError('Server name is required');
    }
  }

  if (!key) {
    logger.error('Error: Secret key is required (--key, -k)');
    throw new ValidationError('Secret key is required');
  }

  try {
    if (isShared) {
      // 공유 시크릿 삭제
      await app.getSecretService().removeSharedSecret(key);
      console.log(`✅ Shared secret '${key}' removed successfully!`);
    } else {
      // 프로필별 시크릿 삭제
      await app.getProfileService().removeProfileSecret(profileName!, serverName!, key);
      console.log(`✅ Secret '${key}' removed successfully from ${profileName}/${serverName}!`);
    }
  } catch (error) {
    logger.error('❌ Error:', { error });
    throw new CliError('Failed to remove secret');
  }
};
