import arg from 'arg';
import { App } from '../../app';
import { envCommand } from './env';
import { secretCommand } from './secret';

export const configCommand = async (app: App, argv: string[]) => {
  const options = arg({}, { argv, permissive: true });

  const subcommand = options['_']?.[0];

  switch (subcommand) {
    case 'env':
      await envCommand(app, argv.slice(1));
      break;
    case 'secret':
      await secretCommand(app, argv.slice(1));
      break;
    default:
      console.error('Unknown subcommand. Available subcommands: env, secret');
      process.exit(1);
  }
};
