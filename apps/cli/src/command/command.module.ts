import { Module } from '@nestjs/common';
import { ProfileCommand } from './profile.command';
import { SecretCommand } from './secret.command';
import { ServerCommand } from './server.command';
@Module({
  providers: [
    // ...ControlPlaneCommand.registerWithSubCommands(),
    ...ProfileCommand.registerWithSubCommands(),
    ...SecretCommand.registerWithSubCommands(),
    ...ServerCommand.registerWithSubCommands(),
  ],
  imports: [],
})
export class CommandModule {}
