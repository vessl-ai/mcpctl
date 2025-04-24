import { DaemonApp } from './app';

const main = async () => {
  try {
    console.log('Starting daemon process...');
    const app = new DaemonApp();
    await app.init();
    console.log('Daemon started successfully');

    const signalHandler = async (signal: string) => {
      console.log(`Received ${signal} signal, initiating graceful shutdown...`);
      await app.dispose();
      console.log('Daemon shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', signalHandler);
    process.on('SIGTERM', signalHandler);

    console.log('Signal handlers registered for graceful shutdown');
  } catch (error) {
    console.error('Fatal error in daemon process:', error);
    process.exit(1);
  }
};

main().catch(error => {
  console.error('Daemon error:', error);
  process.exit(1);
});
