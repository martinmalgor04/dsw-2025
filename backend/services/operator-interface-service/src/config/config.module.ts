import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigTransportMethodsController } from './transport-methods.controller';
import { ConfigCoverageZonesController } from './coverage-zones.controller';
import { ConfigTariffConfigsController } from './tariff-configs.controller';
import { ConfigService } from './config.service';

@Module({
  imports: [HttpModule],
  controllers: [
    ConfigTransportMethodsController,
    ConfigCoverageZonesController,
    ConfigTariffConfigsController,
  ],
  providers: [ConfigService],
})
export class ConfigManagementModule {}
