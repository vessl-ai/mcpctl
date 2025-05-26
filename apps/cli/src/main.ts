import * as fs from 'fs/promises';
import { CommandFactory } from 'nest-commander';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    // Print current profile if exists
    const currentProfilePath = path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.mcpctl',
      'current_profile',
    );
    try {
      const currentProfile = await fs.readFile(currentProfilePath, 'utf-8');
      if (currentProfile.trim()) {
        console.log(`Current profile: ${currentProfile.trim()}`);
      }
    } catch {}
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
