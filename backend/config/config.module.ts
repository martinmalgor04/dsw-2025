import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TransportMethodController } from './transport-method.controller';
import { CoverageZoneController } from './coverage-zone.controller';
import { TransportMethodService } from './services/transport-method.service';
import { CoverageZoneService } from './services/coverage-zone.service';

@Module({
  imports: [PrismaModule],
  controllers: [TransportMethodController, CoverageZoneController],
  providers: [TransportMethodService, CoverageZoneService],
  exports: [TransportMethodService, CoverageZoneService],
})
export class ConfigModule {}

