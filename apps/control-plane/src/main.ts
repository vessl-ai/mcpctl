#!/usr/bin/env node

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

export async function bootstrapControlPlane() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');
  if (!appConfig) {
    throw new Error('App config not found');
  }
  const port = appConfig.port;
  const ipAddress = appConfig.exposeIPAddress;
  await app.listen(port, ipAddress);
  const url = await app.getUrl();
  console.log(`Control plane listening at ${url}`);
}

// Run directly if the file is executed
if (require.main === module) {
  bootstrapControlPlane();
}
