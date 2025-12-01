import { Module } from '@nestjs/common';
import { PrismaModule } from '@logistics/database';
import { TransportMethodController } from './transport-method.controller';
import { CoverageZoneController } from './coverage-zone.controller';
import { TariffConfigController } from './tariff-config.controller';
import { RoutesController } from './routes.controller';
import { TransportMethodService } from './services/transport-method.service';
import { CoverageZoneService } from './services/coverage-zone.service';
import { TariffConfigService } from './services/tariff-config.service';
import { RoutesService } from './services/routes.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    TransportMethodController,
    CoverageZoneController,
    TariffConfigController,
    RoutesController,
  ],
  providers: [
    TransportMethodService,
    CoverageZoneService,
    TariffConfigService,
    RoutesService,
  ],
  exports: [
    TransportMethodService,
    CoverageZoneService,
    TariffConfigService,
    RoutesService,
  ],
})
export class ConfigModule {}
