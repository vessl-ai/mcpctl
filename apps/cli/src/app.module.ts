import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommandModule } from './command/command.module';
import { configurations } from './config';

@Module({
  imports: [
    CommandModule,
    ConfigModule.forRoot({
      load: configurations,
      isGlobal: true,
    }),
    // OsServiceModule,
  ],
  providers: [],
})
export class AppModule {}
