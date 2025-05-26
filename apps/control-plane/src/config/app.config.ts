import { registerAs } from '@nestjs/config';
import * as os from 'os';
import * as path from 'path';

export interface AppConfig {
  port: number;
  exposeIPAddress: string;
  logDir: string;
}

export const appConfiguration = registerAs<AppConfig>('app', () => ({
  port: parseInt(process.env.PORT || '8999', 10),
  exposeIPAddress: process.env.EXPOSE_IP_ADDRESS || '127.0.0.1', // default to loopback
  logDir: process.env.LOG_DIR || path.join(os.homedir(), '.mcpctl', 'log'),
}));
