import { DaemonApp } from "./app";

const main = async () => {
  try {
    const app = new DaemonApp();
    await app.init();
    console.log("Daemon started");

    const signalHandler = (signal: string) => {
        console.log(`Received ${signal}, shutting down...`);
        app.dispose();
        process.exit(0);
    };

    process.on('SIGINT', signalHandler);
    process.on('SIGTERM', signalHandler);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();