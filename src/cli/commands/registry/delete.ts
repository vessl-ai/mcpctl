import arg from 'arg';
import { CliError, ResourceNotFoundError, ValidationError } from '../../../lib/errors';
import { App } from '../../app';

const deleteCommandOptions = {};

export const deleteCommand = async (app: App, argv: string[]) => {
  const options = arg(deleteCommandOptions, { argv });

  const name = options['_']?.[0];

  const logger = app.getLogger();

  if (!name) {
    logger.error('Error: Name is required.');
    throw new ValidationError('Error: Name is required.');
  }

  const registryService = app.getRegistryService();

  try {
    // First check if registry exists
    try {
      registryService.getRegistryDef(name);
    } catch {
      logger.error(`Registry '${name}' not found`);
      throw new ResourceNotFoundError(`Registry '${name}' not found`);
    }

    registryService.deleteRegistryDef(name);

    console.log(`Successfully deleted registry '${name}'`);
  } catch (error) {
    logger.error(`Failed to delete registry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw new CliError('Failed to delete registry');
  }
};
