import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientModule } from './client/client.module';
import { CommandModule } from './command/command.module';
import { configurations } from './config';
import { OsServiceModule } from './os-service/os-service.module';

@Module({
  imports: [
    CommandModule,
    ConfigModule.forRoot({
      load: configurations,
      isGlobal: true,
    }),
    OsServiceModule,
    ClientModule,
  ],
  providers: [],
})
export class AppModule {}
