import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { PrismaModule } from '@logistics/database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health.module';
import { FleetModule } from './fleet/fleet.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../shared/database/.env', '.env.local', '.env'],
    }),
    PrismaModule,
    ConfigModule,
    HealthModule,
    FleetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
