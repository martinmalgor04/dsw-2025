import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import nock from 'nock';

import { AppModule } from '../../src/app.module';
import { StockIntegrationService } from '../../src/services/stock-integration.service';
import { StockCircuitBreakerService } from '../../src/services/stock-circuit-breaker.service';
import { StockCacheService } from '../../src/services/stock-cache.service';
import {
  ProductoStockDto,
  ReservaStockDto,
  EstadoReserva,
} from '../../src/dto';

describe('Stock Integration Service - Integration Tests', () => {
  let app: INestApplication;
  let service: StockIntegrationService;
  let circuitBreaker: StockCircuitBreakerService;
  let cache: StockCacheService;

  const STOCK_API_BASE_URL = 'https://stock.ds.frre.utn.edu.ar/v1';
  const MOCK_PRODUCT_ID = 1;
  const MOCK_RESERVA_ID = 100;
  const MOCK_COMPRA_ID = 'COMPRA-TEST-12345';
  const MOCK_USER_ID = 123;

  const mockProduct: ProductoStockDto = {
    id: MOCK_PRODUCT_ID,
    nombre: 'Laptop Dell Inspiron',
    descripcion: 'Laptop para gaming',
    precio: 150000,
    stockDisponible: 10,
    pesoKg: 2.5,
    dimensiones: {
      largoCm: 30,
      anchoCm: 20,
      altoCm: 15,
    },
    ubicacion: {
      street: 'Av. San Martín 123',
      city: 'Resistencia',
      state: 'Chaco',
      postal_code: 'H3500ABC',
      country: 'Argentina',
    },
  };

  const mockReserva: ReservaStockDto = {
    idReserva: MOCK_RESERVA_ID,
    idCompra: MOCK_COMPRA_ID,
    usuarioId: MOCK_USER_ID,
    estado: EstadoReserva.PENDIENTE,
    expiresAt: '2025-12-31T23:59:59Z',
    fechaCreacion: '2025-01-17T10:00:00Z',
    fechaActualizacion: '2025-01-17T10:00:00Z',
    productos: [
      {
        idProducto: MOCK_PRODUCT_ID,
        nombre: 'Laptop Dell Inspiron',
        cantidad: 1,
        precioUnitario: 150000,
      },
    ],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
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
    nock.cleanAll();
    await app.close();
  });

  beforeEach(async () => {
    // Reset circuit breaker antes de cada test
    circuitBreaker.reset();
    // Limpiar cache antes de cada test
    await cache.clear();
    // Limpiar todos los mocks de nock
    nock.cleanAll();
  });

  describe('HTTP Endpoints', () => {
    describe('GET /', () => {
      it('should return service information', async () => {
        const response = await request(app.getHttpServer())
          .get('/')
          .expect(200);

        expect(response.body).toHaveProperty('service');
        expect(response.body.service).toBe('Stock Integration Service');
        expect(response.body).toHaveProperty('version');
        expect(response.body).toHaveProperty('description');
      });

      it('should include port information', async () => {
        const response = await request(app.getHttpServer())
          .get('/')
          .expect(200);

        expect(response.body).toHaveProperty('port');
        expect(typeof response.body.port).toBe('number');
      });
    });

    describe('GET /health', () => {
      it('should return health status', async () => {
        const response = await request(app.getHttpServer())
          .get('/health')
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('service');
        expect(response.body.service).toBe('Stock Integration Service');
      });

      it('should include environment information', async () => {
        const response = await request(app.getHttpServer())
          .get('/health')
          .expect(200);

        expect(response.body).toHaveProperty('environment');
      });
    });
  });

  describe('Product Integration', () => {
    describe('getProductById - Success', () => {
      it('should retrieve product from external API', async () => {
        // Mock successful API response
        nock(STOCK_API_BASE_URL)
          .get(`/productos/${MOCK_PRODUCT_ID}`)
          .reply(200, mockProduct);

        const product = await service.getProductById(MOCK_PRODUCT_ID);

        expect(product).toBeDefined();
        expect(product.id).toBe(MOCK_PRODUCT_ID);
        expect(product.nombre).toBe(mockProduct.nombre);
        expect(product.precio).toBe(mockProduct.precio);
        expect(product.dimensiones).toEqual(mockProduct.dimensiones);
        expect(circuitBreaker.getState()).toBe('CLOSED');
      });

      it('should cache product after retrieval', async () => {
        nock(STOCK_API_BASE_URL)
          .get(`/productos/${MOCK_PRODUCT_ID}`)
          .reply(200, mockProduct);

        await service.getProductById(MOCK_PRODUCT_ID);

        // Verify product is cached
        const cacheKey = cache.getProductKey(MOCK_PRODUCT_ID);
        const cached = await cache.get<ProductoStockDto>(cacheKey);
        expect(cached).toBeDefined();
        expect(cached?.id).toBe(MOCK_PRODUCT_ID);
      });

      it('should return cached product if available', async () => {
        const cachedProduct = { ...mockProduct, nombre: 'Cached Product' };
        const cacheKey = cache.getProductKey(MOCK_PRODUCT_ID);
        await cache.set(cacheKey, cachedProduct, 300);

        const product = await service.getProductById(MOCK_PRODUCT_ID);

        expect(product).toEqual(cachedProduct);
        expect(nock.isDone()).toBe(false); // No se hizo request HTTP
      });
    });

    describe('getProductById - Circuit Breaker Protection', () => {
      it('should return default product when circuit breaker is OPEN', async () => {
        // Force circuit breaker to OPEN state
        for (let i = 0; i < 5; i++) {
          circuitBreaker.recordFailure();
        }

        const product = await service.getProductById(MOCK_PRODUCT_ID);

        expect(product).toBeDefined();
        expect(product.nombre).toBe('Producto No Disponible');
        expect(product.stockDisponible).toBe(0);
        expect(nock.isDone()).toBe(false); // No se hizo request HTTP
      });

      it('should record failure when API request fails', async () => {
        const initialFailures = circuitBreaker.getFailureCount();

        nock(STOCK_API_BASE_URL)
          .get(`/productos/${MOCK_PRODUCT_ID}`)
          .reply(500, { error: 'Internal Server Error' });

        await service.getProductById(MOCK_PRODUCT_ID);

        expect(circuitBreaker.getFailureCount()).toBeGreaterThan(
          initialFailures,
        );
      });
    });

    describe('getProductById - Retry Logic', () => {
      it('should retry on network errors', async () => {
        // First attempt fails, second succeeds
        nock(STOCK_API_BASE_URL)
          .get(`/productos/${MOCK_PRODUCT_ID}`)
          .replyWithError({ code: 'ECONNREFUSED' })
          .get(`/productos/${MOCK_PRODUCT_ID}`)
          .reply(200, mockProduct);

        const product = await service.getProductById(MOCK_PRODUCT_ID);

        expect(product).toBeDefined();
        expect(product.id).toBe(MOCK_PRODUCT_ID);
      });

      it('should retry on 5xx errors', async () => {
        // First two attempts fail with 500, third succeeds
        nock(STOCK_API_BASE_URL)
          .get(`/productos/${MOCK_PRODUCT_ID}`)
          .times(2)
          .reply(500, { error: 'Internal Server Error' })
          .get(`/productos/${MOCK_PRODUCT_ID}`)
          .reply(200, mockProduct);

        const product = await service.getProductById(MOCK_PRODUCT_ID);

        expect(product).toBeDefined();
        expect(product.id).toBe(MOCK_PRODUCT_ID);
      });

      it('should return default product after max retries', async () => {
        // All attempts fail
        nock(STOCK_API_BASE_URL)
          .get(`/productos/${MOCK_PRODUCT_ID}`)
          .times(3)
          .reply(500, { error: 'Internal Server Error' });

        const product = await service.getProductById(MOCK_PRODUCT_ID);

        expect(product).toBeDefined();
        expect(product.nombre).toBe('Producto No Disponible');
      });
    });
  });

  describe('Reserva Integration', () => {
    describe('getReservaByCompraId - Success', () => {
      it('should retrieve reserva from external API', async () => {
        const reservas = [mockReserva];

        nock(STOCK_API_BASE_URL)
          .get(`/reservas?usuarioId=${MOCK_USER_ID}`)
          .reply(200, reservas);

        const reserva = await service.getReservaByCompraId(
          MOCK_COMPRA_ID,
          MOCK_USER_ID,
        );

        expect(reserva).toBeDefined();
        expect(reserva?.idCompra).toBe(MOCK_COMPRA_ID);
        expect(reserva?.usuarioId).toBe(MOCK_USER_ID);
        expect(reserva?.estado).toBe(EstadoReserva.PENDIENTE);
      });

      it('should cache reserva after retrieval', async () => {
        const reservas = [mockReserva];

        nock(STOCK_API_BASE_URL)
          .get(`/reservas?usuarioId=${MOCK_USER_ID}`)
          .reply(200, reservas);

        await service.getReservaByCompraId(MOCK_COMPRA_ID, MOCK_USER_ID);

        // Verify reserva is cached
        const cacheKey = cache.getReservaByCompraKey(
          MOCK_COMPRA_ID,
          MOCK_USER_ID,
        );
        const cached = await cache.get<ReservaStockDto>(cacheKey);
        expect(cached).toBeDefined();
        expect(cached?.idCompra).toBe(MOCK_COMPRA_ID);
      });

      it('should return null when reserva not found', async () => {
        nock(STOCK_API_BASE_URL)
          .get(`/reservas?usuarioId=${MOCK_USER_ID}`)
          .reply(200, []);

        const reserva = await service.getReservaByCompraId(
          'NON-EXISTENT-COMPRA',
          MOCK_USER_ID,
        );

        expect(reserva).toBeNull();
      });
    });

    describe('getReservaById - Success', () => {
      it('should retrieve reserva by ID from external API', async () => {
        nock(STOCK_API_BASE_URL)
          .get(`/reservas/${MOCK_RESERVA_ID}?usuarioId=${MOCK_USER_ID}`)
          .reply(200, mockReserva);

        const reserva = await service.getReservaById(
          MOCK_RESERVA_ID,
          MOCK_USER_ID,
        );

        expect(reserva).toBeDefined();
        expect(reserva?.idReserva).toBe(MOCK_RESERVA_ID);
        expect(reserva?.idCompra).toBe(MOCK_COMPRA_ID);
      });
    });

    describe('updateReservaStatus - Success', () => {
      it('should update reserva status', async () => {
        const updatedReserva = {
          ...mockReserva,
          estado: EstadoReserva.CONFIRMADO,
        };

        nock(STOCK_API_BASE_URL)
          .patch(`/reservas/${MOCK_RESERVA_ID}`, {
            usuarioId: MOCK_USER_ID,
            estado: EstadoReserva.CONFIRMADO,
          })
          .reply(200, updatedReserva);

        const reserva = await service.updateReservaStatus(
          MOCK_RESERVA_ID,
          EstadoReserva.CONFIRMADO,
          MOCK_USER_ID,
        );

        expect(reserva).toBeDefined();
        expect(reserva.estado).toBe(EstadoReserva.CONFIRMADO);
      });

      it('should invalidate cache after update', async () => {
        // First, cache the reserva
        const cacheKey = cache.getReservaByCompraKey(
          MOCK_COMPRA_ID,
          MOCK_USER_ID,
        );
        await cache.set(cacheKey, mockReserva, 300);

        const updatedReserva = {
          ...mockReserva,
          estado: EstadoReserva.CONFIRMADO,
        };

        nock(STOCK_API_BASE_URL)
          .patch(`/reservas/${MOCK_RESERVA_ID}`)
          .reply(200, updatedReserva);

        await service.updateReservaStatus(
          MOCK_RESERVA_ID,
          EstadoReserva.CONFIRMADO,
          MOCK_USER_ID,
        );

        // Verify cache was invalidated
        const cached = await cache.get<ReservaStockDto>(cacheKey);
        expect(cached).toBeNull();
      });
    });

    describe('updateReservaStatus - Circuit Breaker Protection', () => {
      it('should throw error when circuit breaker is OPEN', async () => {
        // Force circuit breaker to OPEN state
        for (let i = 0; i < 5; i++) {
          circuitBreaker.recordFailure();
        }

        await expect(
          service.updateReservaStatus(
            MOCK_RESERVA_ID,
            EstadoReserva.CONFIRMADO,
            MOCK_USER_ID,
          ),
        ).rejects.toThrow('Stock service unavailable - circuit breaker is open');
      });
    });

    describe('getAndUpdateReservaStatus - Success', () => {
      it('should get and update reserva status', async () => {
        const reservas = [mockReserva];
        const updatedReserva = {
          ...mockReserva,
          estado: EstadoReserva.CONFIRMADO,
        };

        nock(STOCK_API_BASE_URL)
          .get(`/reservas?usuarioId=${MOCK_USER_ID}`)
          .reply(200, reservas)
          .patch(`/reservas/${MOCK_RESERVA_ID}`, {
            usuarioId: MOCK_USER_ID,
            estado: EstadoReserva.CONFIRMADO,
          })
          .reply(200, updatedReserva);

        const reserva = await service.getAndUpdateReservaStatus(
          MOCK_COMPRA_ID,
          MOCK_USER_ID,
          EstadoReserva.CONFIRMADO,
        );

        expect(reserva).toBeDefined();
        expect(reserva?.estado).toBe(EstadoReserva.CONFIRMADO);
      });

      it('should return null when reserva not found', async () => {
        nock(STOCK_API_BASE_URL)
          .get(`/reservas?usuarioId=${MOCK_USER_ID}`)
          .reply(200, []);

        const reserva = await service.getAndUpdateReservaStatus(
          'NON-EXISTENT-COMPRA',
          MOCK_USER_ID,
          EstadoReserva.CONFIRMADO,
        );

        expect(reserva).toBeNull();
      });
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should transition from CLOSED to OPEN after threshold failures', async () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');

      // Simulate failures
      for (let i = 0; i < 5; i++) {
        nock(STOCK_API_BASE_URL)
          .get(`/productos/${MOCK_PRODUCT_ID}`)
          .reply(500, { error: 'Internal Server Error' });

        await service.getProductById(MOCK_PRODUCT_ID);
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should transition from OPEN to HALF_OPEN after timeout', async () => {
      // Force OPEN state
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Simulate timeout passing (manually set lastFailureTime)
      const timeout = 30000; // 30 seconds
      (circuitBreaker as any).lastFailureTime = Date.now() - timeout - 1000;

      // Check if circuit breaker allows request (HALF_OPEN)
      const isOpen = circuitBreaker.isOpen();
      expect(isOpen).toBe(false);
    });

    it('should transition from HALF_OPEN to CLOSED on success', async () => {
      // Force HALF_OPEN state
      (circuitBreaker as any).state = 'HALF_OPEN';
      (circuitBreaker as any).failureCount = 3;

      nock(STOCK_API_BASE_URL)
        .get(`/productos/${MOCK_PRODUCT_ID}`)
        .reply(200, mockProduct);

      await service.getProductById(MOCK_PRODUCT_ID);

      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe('Cache Integration', () => {
    it('should use cache for product retrieval', async () => {
      const cachedProduct = { ...mockProduct, nombre: 'Cached Product' };
      const cacheKey = cache.getProductKey(MOCK_PRODUCT_ID);
      await cache.set(cacheKey, cachedProduct, 300);

      const product = await service.getProductById(MOCK_PRODUCT_ID);

      expect(product).toEqual(cachedProduct);
      expect(nock.isDone()).toBe(false); // No se hizo request HTTP
    });

    it('should set cache after successful API call', async () => {
      nock(STOCK_API_BASE_URL)
        .get(`/productos/${MOCK_PRODUCT_ID}`)
        .reply(200, mockProduct);

      await service.getProductById(MOCK_PRODUCT_ID);

      // Verify product is cached
      const cacheKey = cache.getProductKey(MOCK_PRODUCT_ID);
      const cached = await cache.get<ProductoStockDto>(cacheKey);
      expect(cached).toBeDefined();
      expect(cached?.id).toBe(MOCK_PRODUCT_ID);
    });

    it('should use cache for reserva retrieval', async () => {
      const cachedReserva = { ...mockReserva, estado: EstadoReserva.CONFIRMADO };
      const cacheKey = cache.getReservaByCompraKey(
        MOCK_COMPRA_ID,
        MOCK_USER_ID,
      );
      await cache.set(cacheKey, cachedReserva, 300);

      const reserva = await service.getReservaByCompraId(
        MOCK_COMPRA_ID,
        MOCK_USER_ID,
      );

      expect(reserva).toEqual(cachedReserva);
      expect(nock.isDone()).toBe(false); // No se hizo request HTTP
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      nock(STOCK_API_BASE_URL)
        .get(`/productos/999`)
        .reply(404, { error: 'Product not found' });

      const product = await service.getProductById(999);

      expect(product).toBeDefined();
      expect(product.nombre).toBe('Producto No Disponible');
    });

    it('should handle network timeout errors', async () => {
      nock(STOCK_API_BASE_URL)
        .get(`/productos/${MOCK_PRODUCT_ID}`)
        .delayConnection(10000) // Simulate timeout
        .reply(408, { error: 'Request Timeout' });

      const product = await service.getProductById(MOCK_PRODUCT_ID);

      expect(product).toBeDefined();
      expect(product.nombre).toBe('Producto No Disponible');
    });

    it('should handle connection refused errors', async () => {
      nock(STOCK_API_BASE_URL)
        .get(`/productos/${MOCK_PRODUCT_ID}`)
        .replyWithError({ code: 'ECONNREFUSED' });

      const product = await service.getProductById(MOCK_PRODUCT_ID);

      expect(product).toBeDefined();
      expect(product.nombre).toBe('Producto No Disponible');
    });
  });

  describe('Service Health Check', () => {
    it('should return healthy status when all services are working', async () => {
      const health = await service.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.cache).toBe(true);
      expect(health.circuitBreaker).toBeDefined();
    });

    it('should return unhealthy status when circuit breaker is OPEN', async () => {
      // Force circuit breaker to OPEN
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }

      const health = await service.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.circuitBreaker.state).toBe('OPEN');
    });
  });

  describe('Performance', () => {
    it('should complete requests within acceptable time', async () => {
      nock(STOCK_API_BASE_URL)
        .get(`/productos/${MOCK_PRODUCT_ID}`)
        .reply(200, mockProduct);

      const startTime = Date.now();
      await service.getProductById(MOCK_PRODUCT_ID);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds (including retry delays)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent requests', async () => {
      nock(STOCK_API_BASE_URL)
        .get(`/productos/${MOCK_PRODUCT_ID}`)
        .times(5)
        .reply(200, mockProduct);

      const requests = Array.from({ length: 5 }, () =>
        service.getProductById(MOCK_PRODUCT_ID),
      );

      const products = await Promise.all(requests);

      expect(products).toHaveLength(5);
      products.forEach((product) => {
        expect(product).toBeDefined();
        expect(product.id).toBe(MOCK_PRODUCT_ID);
      });
    });
  });
});

