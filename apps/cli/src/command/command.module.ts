import { Module } from '@nestjs/common';
import { OsServiceModule } from '../os-service/os-service.module';
import { ControlPlaneCommand } from './control-plane.command';
import { ProfileCommand } from './profile.command';
import { SecretCommand } from './secret.command';
import { ServerCommand } from './server.command';
@Module({
  providers: [
    ...ControlPlaneCommand.registerWithSubCommands(),
    ...ProfileCommand.registerWithSubCommands(),
    ...SecretCommand.registerWithSubCommands(),
    ...ServerCommand.registerWithSubCommands(),
  ],
  imports: [OsServiceModule],
})
export class CommandModule {}
