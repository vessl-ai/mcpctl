import arg from 'arg';
import { App } from '../../app';

const serverLogsCommandOptions = {};

export const serverLogsCommand = async (app: App, argv: string[]) => {
  const options = arg(serverLogsCommandOptions, { argv });

  console.log('Server logs command');
};
