import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configurations } from './config/configruation';
import { ControlModule } from './control/control.module';
import { LogModule } from './log/log.module';
import { SecretModule } from './secret/secret.module';
import { ServerModule } from './server/server.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
    }),
    LogModule,
    SecretModule,
    ServerModule,
    ControlModule,
  ],
})
export class AppModule {}
