import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@logistics/database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigManagementModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { FleetModule } from './fleet/fleet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    PrismaModule,
    ConfigManagementModule,
    HealthModule,
    FleetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}