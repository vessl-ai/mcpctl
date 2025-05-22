#!/usr/bin/env node

import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const debugMode = process.env.DEBUG === 'true';
    if (debugMode) {
      console.log('Starting MCPCTL...');
    }
    await CommandFactory.run(AppModule, {
      logger: debugMode ? ['error', 'warn', 'log', 'verbose', 'debug'] : [],
    });
  } catch (error) {
    console.error('Failed to start MCPCTL');
    console.error(error);
  }
}

bootstrap();
