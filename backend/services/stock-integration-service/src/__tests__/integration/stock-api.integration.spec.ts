import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StockIntegrationModule } from '../../stock-integration.module';
import { StockIntegrationService } from '../../services/stock-integration.service';
import { StockCircuitBreakerService } from '../../services/stock-circuit-breaker.service';
import { StockCacheService } from '../../services/stock-cache.service';

describe('StockIntegrationService Integration', () => {
  let app: INestApplication;
  let service: StockIntegrationService;
  let circuitBreaker: StockCircuitBreakerService;
  let cache: StockCacheService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        StockIntegrationModule,
        ConfigModule.forRoot({
          envFilePath: '.env.test',
          isGlobal: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<StockIntegrationService>(
      StockIntegrationService,
    );
    circuitBreaker = moduleFixture.get<StockCircuitBreakerService>(
      StockCircuitBreakerService,
    );
    cache = moduleFixture.get<StockCacheService>(StockCacheService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Service Initialization', () => {
    it('should initialize all services correctly', () => {
      expect(service).toBeDefined();
      expect(circuitBreaker).toBeDefined();
      expect(cache).toBeDefined();
    });

    it('should start with circuit breaker in CLOSED state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('CLOSED');
      expect(stats.failureCount).toBe(0);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when all services are working', async () => {
      const healthCheck = await service.healthCheck();

      expect(healthCheck).toBeDefined();
      expect(healthCheck.service).toBe('StockIntegrationService');
      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.cache).toBe(true);
      expect(healthCheck.circuitBreaker).toBeDefined();
    });
  });

  describe('Cache Integration', () => {
    it('should perform cache operations correctly', async () => {
      const testKey = 'test:integration:key';
      const testValue = { id: 1, name: 'test' };

      // Test SET
      await cache.set(testKey, testValue, 60);

      // Test GET
      const retrieved = await cache.get(testKey);
      expect(retrieved).toEqual(testValue);

      // Test DELETE
      await cache.delete(testKey);
      const afterDelete = await cache.get(testKey);
      expect(afterDelete).toBeNull();
    });

    it('should perform cache health check', async () => {
      const isHealthy = await cache.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should handle failure threshold correctly', () => {
      // Reset circuit breaker
      circuitBreaker.reset();
      expect(circuitBreaker.getState()).toBe('CLOSED');

      // Record failures up to threshold
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
      expect(circuitBreaker.isOpen()).toBe(true);
    });

    it('should transition from OPEN to HALF_OPEN after timeout', () => {
      // Force OPEN state with old timestamp
      (circuitBreaker as any).state = 'OPEN';
      (circuitBreaker as any).lastFailureTime = Date.now() - 35000; // 35 seconds ago

      // Should transition to HALF_OPEN
      expect(circuitBreaker.isOpen()).toBe(false);
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    it('should transition from HALF_OPEN to CLOSED on success', () => {
      // Force HALF_OPEN state
      (circuitBreaker as any).state = 'HALF_OPEN';
      (circuitBreaker as any).failureCount = 3;

      circuitBreaker.recordSuccess();
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe('Mock Stock API Integration', () => {
    it('should handle product retrieval with fallback', async () => {
      // This test will use the fallback since we don't have a real Stock API
      const product = await service.getProductById(1);

      expect(product).toBeDefined();
      expect(product.id).toBe(1);
      expect(product.nombre).toBe('Producto No Disponible');
      expect(product.pesoKg).toBe(1.0);
      expect(product.dimensiones).toBeDefined();
      expect(product.ubicacion.postal_code).toMatch(/^[A-Z]\d{4}[A-Z]{3}$/);
    });

    it('should handle reserva retrieval with fallback', async () => {
      // This test will return null since we don't have a real Stock API
      const reserva = await service.getReservaByCompraId(
        'COMPRA-TEST-123',
        123,
      );

      expect(reserva).toBeNull();
    });

    it('should handle reserva update with circuit breaker protection', async () => {
      // Force circuit breaker to OPEN state
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }

      // Should throw error when circuit breaker is open
      await expect(
        service.updateReservaStatus(1, 'confirmado' as any, 123),
      ).rejects.toThrow('Stock service unavailable - circuit breaker is open');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Reset circuit breaker
      circuitBreaker.reset();

      // Try to get a product (will fail due to no real API)
      const product = await service.getProductById(999);

      // Should return fallback product
      expect(product).toBeDefined();
      expect(product.nombre).toBe('Producto No Disponible');
    });

    it('should record failures in circuit breaker', () => {
      const initialFailures = circuitBreaker.getFailureCount();

      circuitBreaker.recordFailure();

      expect(circuitBreaker.getFailureCount()).toBe(initialFailures + 1);
    });
  });

  describe('Performance', () => {
    it('should perform cache operations within acceptable time', async () => {
      const startTime = Date.now();

      // Perform multiple cache operations
      for (let i = 0; i < 10; i++) {
        await cache.set(`perf:test:${i}`, { id: i, data: 'test' }, 60);
        await cache.get(`perf:test:${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Configuration', () => {
    it('should use correct configuration values', () => {
      const stats = circuitBreaker.getStats();

      expect(stats.threshold).toBe(5);
      expect(stats.state).toBeDefined();
      expect(stats.failureCount).toBeDefined();
    });
  });
});
