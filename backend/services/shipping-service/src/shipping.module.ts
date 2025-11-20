import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ShippingController } from './shipping.controller';
import { TrackingController } from './tracking.controller';
import { ShippingService } from './shipping.service';
import { MockDataService } from './services/mock-data.service';
import { QuoteCacheService } from './services/quote-cache.service';
import { DistanceCalculationService } from './services/distance-calculation.service';
import { TariffCalculationService } from './services/tariff-calculation.service';
import { PostalCodeValidationService } from './services/postal-code-validation.service';

@Module({
  imports: [
    HttpModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        ttl: parseInt(config.get<string>('PRODUCT_CACHE_TTL', '600'), 10),
        max: parseInt(config.get<string>('STOCK_CACHE_MAX_ITEMS', '1000'), 10),
        store: 'memory',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ShippingController, TrackingController],
  providers: [
    ShippingService,
    MockDataService,
    QuoteCacheService,
    DistanceCalculationService,
    TariffCalculationService,
    PostalCodeValidationService,
  ],
  exports: [ShippingService],
})
export class ShippingModule {}
