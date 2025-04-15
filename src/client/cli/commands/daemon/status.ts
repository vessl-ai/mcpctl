import { Command } from 'commander';
import { DaemonRPCClient } from '../../../core/lib/rpc/client';
import { App } from '../../app';

export const buildStatusCommand = (app: App): Command => {
  return new Command('status')
    .description('Show the MCP daemon status')
    .action(async () => {
      let daemonClient: DaemonRPCClient | undefined;
      try {
        daemonClient = await DaemonRPCClient.getInstance();
        const status = await daemonClient.status();
        console.log(`Daemon status: ${status.isRunning ? 'running' : 'stopped'}`);
        console.log(`Daemon uptime: ${status.uptime}ms`);
      } catch (error) {
        console.error('Failed to get daemon status:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      } finally {
        if (daemonClient) {
          daemonClient.dispose();
        }
      }
    });
} 