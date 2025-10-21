import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { StockIntegrationService } from './services/stock-integration.service';
import { StockCircuitBreakerService } from './services/stock-circuit-breaker.service';
import { StockCacheService } from './services/stock-cache.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get<number>('STOCK_API_TIMEOUT', 2000),
        maxRedirects: 3,
        baseURL: configService.get<string>('STOCK_API_URL'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: parseInt(configService.get<string>('STOCK_CACHE_TTL', '600'), 10), // 10 minutos
        max: parseInt(configService.get<string>('STOCK_CACHE_MAX_ITEMS', '1000'), 10),
        store: 'memory', // Por ahora usamos memoria, luego Redis
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [
    StockIntegrationService,
    StockCircuitBreakerService,
    StockCacheService,
  ],
  exports: [StockIntegrationService],
})
export class StockIntegrationModule {}
