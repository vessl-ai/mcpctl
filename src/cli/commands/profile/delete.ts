import arg from 'arg';
import { CliError } from '../../../lib/errors';
import { App } from '../../app';

const profileDeleteCommandOptions = {};

export const profileDeleteCommand = async (app: App, argv: string[]) => {
  const options = arg(profileDeleteCommandOptions, { argv });

  const logger = app.getLogger();

  const name = options['_']?.[0];

  if (!name) {
    logger.error('Error: Name is required.');
    throw new CliError('Error: Name is required.');
  }

  app.getProfileService().deleteProfile(name);
  console.log(`✨ Profile '${name}' deleted successfully!`);
};
