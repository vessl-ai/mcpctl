import { Module } from '@nestjs/common';
import { OsServiceModule } from '../os-service/os-service.module';
import { ControlPlaneCommand } from './control-plane.command';
import { LogCommand } from './log.command';
import { ProfileCommand } from './profile.command';
import { SecretCommand } from './secret.command';
import { ServerCommand } from './server.command';
@Module({
  providers: [
    ...ControlPlaneCommand.registerWithSubCommands(),
    ...ProfileCommand.registerWithSubCommands(),
    ...SecretCommand.registerWithSubCommands(),
    ...ServerCommand.registerWithSubCommands(),
    ...LogCommand.registerWithSubCommands(),
  ],
  imports: [OsServiceModule],
})
export class CommandModule {}
