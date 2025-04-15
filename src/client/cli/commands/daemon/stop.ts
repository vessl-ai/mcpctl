import { Command } from 'commander';
import { DaemonRPCClient } from '../../../core/lib/rpc/client';
import { App } from '../../app';

export const buildStopCommand = (app: App): Command => {
  return new Command('stop')
    .description('Stop the MCP daemon')
    .action(async () => {
      let daemonClient: DaemonRPCClient | undefined;
      try {
        daemonClient = await DaemonRPCClient.getInstance();
        await daemonClient.shutdown();
        console.log('Daemon stopped');
      } catch (error: unknown) {
        // @ts-ignore
        if (error.code === "ENOENT") {
          console.error('Daemon is not running, trying to start it by running `mcp daemon start`');
        } else {
          console.error('Failed to stop daemon:', error instanceof Error ? error.message : 'Unknown error');
        }
        throw error;
      } finally {
        if (daemonClient) {
          daemonClient.dispose();
        }
      }
    });
} 