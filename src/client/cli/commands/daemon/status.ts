import { Command } from 'commander';
import { DaemonClient } from '../../../client/core/daemon/client';
import { App } from '../../app';

export const buildStatusCommand = (app: App): Command => {
  return new Command('status')
    .description('Show the MCP daemon status')
    .action(async () => {
      try {
        const client = new DaemonClient();
        const daemon = app.getDaemon();

        const isRunning = await daemon.isRunning();
        console.log(`Daemon status: ${isRunning ? 'running' : 'stopped'}`);

        if (isRunning) {
          try {
            const workers = await client.listWorkers();
            console.log('\nActive workers:');
            if (workers.length === 0) {
              console.log('  No active workers');
            } else {
              for (const worker of workers) {
                console.log(`  - ${worker.name} (${worker.profile})`);
                console.log(`    ID: ${worker.id}`);
                console.log(`    Status: ${worker.status}`);
              }
            }
          } catch (error) {
            console.error('Failed to get worker status:', error instanceof Error ? error.message : 'Unknown error');
          }
        }
      } catch (error) {
        console.error('Failed to get daemon status:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
} 