import { Module } from '@nestjs/common';
import { PrismaModule } from '@logistics/database';
import { TransportMethodController } from './transport-method.controller';
import { CoverageZoneController } from './coverage-zone.controller';
import { TariffConfigController } from './tariff-config.controller';
import { TransportMethodService } from './services/transport-method.service';
import { CoverageZoneService } from './services/coverage-zone.service';
import { TariffConfigService } from './services/tariff-config.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    TransportMethodController,
    CoverageZoneController,
    TariffConfigController,
  ],
  providers: [TransportMethodService, CoverageZoneService, TariffConfigService],
  exports: [TransportMethodService, CoverageZoneService, TariffConfigService],
})
export class ConfigModule {}
