import { Command } from 'commander';
import { DaemonClient } from '../../../client/core/daemon/client';
import { App } from '../../app';

export const buildStopCommand = (app: App): Command => {
  return new Command('stop')
    .description('Stop the MCP daemon')
    .action(async () => {
      try {
        const client = new DaemonClient();
        await client.shutdown();
        console.log('Daemon stopped');
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('Failed to connect to daemon')) {
          console.error('Daemon is not running');
        } else {
          console.error('Failed to stop daemon:', error instanceof Error ? error.message : 'Unknown error');
        }
        process.exit(1);
      }
    });
} 