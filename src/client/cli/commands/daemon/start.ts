import { spawn } from "child_process";
import { Command } from "commander";
import path from "path";
import { App } from "../../app";

export const buildStartCommand = (app: App): Command => {
  return new Command('start')
    .description('Start the MCP daemon')
    .action(async () => {
      const isDev = process.env.NODE_ENV === 'development';
      const command = isDev ? 'ts-node' : 'node';
      const scriptPath = isDev 
        ? path.join(__dirname, '../../../../daemon/main.ts')
        : path.join(__dirname, '../../../../daemon/main.js');

      console.log(`Starting daemon with command: ${command} ${scriptPath}`);
      const child = spawn(command, [scriptPath], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      child.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(message);
        if (message.includes('Daemon started')) {
          child.unref();
          child.stdout.destroy();
          child.stderr.destroy();
        }
      });

      child.stderr.on('data', (data) => {
        console.error(data.toString());
      });
    });
};