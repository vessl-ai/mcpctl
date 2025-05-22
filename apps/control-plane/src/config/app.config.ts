import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  exposeIPAddress: string;
}

export const appConfiguration = registerAs<AppConfig>('app', () => ({
  port: parseInt(process.env.PORT || '8999', 10),
  exposeIPAddress: process.env.EXPOSE_IP_ADDRESS || '127.0.0.1', // default to loopback
}));
