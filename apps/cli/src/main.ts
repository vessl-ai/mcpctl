#!/usr/bin/env node

import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('Starting MCPCTL...');
    await CommandFactory.run(AppModule);
  } catch (error) {
    console.error('Failed to start MCPCTL');
    console.error(error);
  }
}

bootstrap();
