import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';

import { StockIntegrationService } from '../services/stock-integration.service';
import { StockCircuitBreakerService } from '../services/stock-circuit-breaker.service';
import { StockCacheService } from '../services/stock-cache.service';
import { ProductoStockDto, ReservaStockDto, EstadoReserva } from '../dto';

describe('StockIntegrationService', () => {
  let service: StockIntegrationService;
  let httpService: HttpService;
  let circuitBreaker: StockCircuitBreakerService;
  let cache: StockCacheService;
  let configService: ConfigService;

  const mockProduct: ProductoStockDto = {
    id: 1,
    nombre: 'Test Product',
    descripcion: 'Test Description',
    precio: 1000,
    stockDisponible: 10,
    pesoKg: 2.5,
    dimensiones: {
      largoCm: 30,
      anchoCm: 20,
      altoCm: 15,
    },
    ubicacion: {
      street: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      postal_code: 'H3500ABC',
      country: 'Argentina',
    },
  };

  const mockReserva: ReservaStockDto = {
    idReserva: 1,
    idCompra: 'COMPRA-123',
    usuarioId: 123,
    estado: EstadoReserva.PENDIENTE,
    expiresAt: '2025-01-20T10:30:00Z',
    fechaCreacion: '2025-01-17T10:30:00Z',
    fechaActualizacion: '2025-01-17T10:30:00Z',
    productos: [
      {
        idProducto: 1,
        nombre: 'Test Product',
        cantidad: 2,
        precioUnitario: 1000,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockIntegrationService,
        {
          provide: HttpService,
          useValue: {
            request: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                STOCK_API_URL: 'https://stock.ds.frre.utn.edu.ar/v1',
                STOCK_API_TIMEOUT: 2000,
                STOCK_API_RETRY_ATTEMPTS: 3,
                STOCK_API_RETRY_DELAY: 1000,
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: StockCircuitBreakerService,
          useValue: {
            isOpen: jest.fn(),
            recordSuccess: jest.fn(),
            recordFailure: jest.fn(),
            getStats: jest.fn().mockReturnValue({
              state: 'CLOSED',
              failureCount: 0,
              threshold: 5,
              lastFailureTime: 0,
              timeSinceLastFailure: 0,
            }),
          },
        },
        {
          provide: StockCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            getProductKey: jest.fn().mockReturnValue('stock:product:1'),
            getReservaByCompraKey: jest.fn().mockReturnValue('stock:reserva:COMPRA-123:123'),
            getReservaByIdKey: jest.fn().mockReturnValue('stock:reserva:1:123'),
            healthCheck: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<StockIntegrationService>(StockIntegrationService);
    httpService = module.get<HttpService>(HttpService);
    circuitBreaker = module.get<StockCircuitBreakerService>(StockCircuitBreakerService);
    cache = module.get<StockCacheService>(StockCacheService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProductById', () => {
    it('should return product from cache if available', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(mockProduct);

      const result = await service.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(cache.get).toHaveBeenCalledWith('stock:product:1');
    });

    it('should return default product when circuit breaker is open', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(true);

      const result = await service.getProductById(1);

      expect(result).toEqual({
        id: 1,
        nombre: 'Producto No Disponible',
        descripcion: 'Producto temporalmente no disponible',
        precio: 0,
        stockDisponible: 0,
        pesoKg: 1.0,
        dimensiones: { largoCm: 10, anchoCm: 10, altoCm: 10 },
        ubicacion: {
          street: 'Calle Default',
          city: 'Ciudad Default',
          state: 'Provincia Default',
          postal_code: 'H3500ABC',
          country: 'Argentina',
        },
      });
    });

    it('should make HTTP request and cache result on success', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(false);
      jest.spyOn(httpService, 'request').mockReturnValue(of({ data: mockProduct }));
      jest.spyOn(cache, 'set').mockResolvedValue(undefined);
      jest.spyOn(circuitBreaker, 'recordSuccess').mockImplementation();

      const result = await service.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(cache.set).toHaveBeenCalledWith('stock:product:1', mockProduct);
      expect(circuitBreaker.recordSuccess).toHaveBeenCalled();
    });

    it('should handle HTTP errors and return default product', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(false);
      jest.spyOn(httpService, 'request').mockReturnValue(throwError(() => new Error('HTTP Error')));
      jest.spyOn(circuitBreaker, 'recordFailure').mockImplementation();

      const result = await service.getProductById(1);

      expect(result).toEqual({
        id: 1,
        nombre: 'Producto No Disponible',
        descripcion: 'Producto temporalmente no disponible',
        precio: 0,
        stockDisponible: 0,
        pesoKg: 1.0,
        dimensiones: { largoCm: 10, anchoCm: 10, altoCm: 10 },
        ubicacion: {
          street: 'Calle Default',
          city: 'Ciudad Default',
          state: 'Provincia Default',
          postal_code: 'H3500ABC',
          country: 'Argentina',
        },
      });
      expect(circuitBreaker.recordFailure).toHaveBeenCalled();
    });
  });

  describe('getReservaByCompraId', () => {
    it('should find reserva by compraId from user reservas list', async () => {
      const mockReservas = [
        { idReserva: 1, idCompra: 'COMPRA-123', estado: 'pendiente' },
        { idReserva: 2, idCompra: 'COMPRA-456', estado: 'confirmado' }
      ];
      
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(false);
      jest.spyOn(httpService, 'request').mockReturnValue(of({ data: mockReservas }));
      jest.spyOn(cache, 'set').mockResolvedValue(undefined);
      jest.spyOn(circuitBreaker, 'recordSuccess').mockImplementation();

      const result = await service.getReservaByCompraId('COMPRA-456', 123);

      expect(result).toEqual({ idReserva: 2, idCompra: 'COMPRA-456', estado: 'confirmado' });
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('/reservas?usuarioId=123')
        })
      );
    });

    it('should return null when reserva not found', async () => {
      const mockReservas = [
        { idReserva: 1, idCompra: 'COMPRA-123', estado: 'pendiente' }
      ];
      
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(false);
      jest.spyOn(httpService, 'request').mockReturnValue(of({ data: mockReservas }));
      jest.spyOn(circuitBreaker, 'recordSuccess').mockImplementation();

      const result = await service.getReservaByCompraId('COMPRA-NOT-FOUND', 123);

      expect(result).toBeNull();
    });

    it('should return cached reserva if available', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(mockReserva);

      const result = await service.getReservaByCompraId('COMPRA-123', 123);

      expect(result).toEqual(mockReserva);
      expect(cache.get).toHaveBeenCalledWith('stock:reserva:COMPRA-123:123');
    });
  });

  describe('updateReservaStatus', () => {
    it('should update reserva status successfully', async () => {
      const updatedReserva = { ...mockReserva, estado: EstadoReserva.CONFIRMADO };
      
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(false);
      jest.spyOn(httpService, 'request').mockReturnValue(of({ data: updatedReserva }));
      jest.spyOn(cache, 'delete').mockResolvedValue(undefined);
      jest.spyOn(circuitBreaker, 'recordSuccess').mockImplementation();

      const result = await service.updateReservaStatus(1, EstadoReserva.CONFIRMADO, 123);

      expect(result).toEqual(updatedReserva);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          url: expect.stringContaining('/reservas/1'),
          data: {
            usuarioId: 123,
            estado: EstadoReserva.CONFIRMADO,
          }
        })
      );
      expect(circuitBreaker.recordSuccess).toHaveBeenCalled();
    });

    it('should throw error when circuit breaker is open', async () => {
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(true);

      await expect(
        service.updateReservaStatus(1, EstadoReserva.CONFIRMADO, 123)
      ).rejects.toThrow('Stock service unavailable - circuit breaker is open');
    });

    it('should handle HTTP errors and record failure', async () => {
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(false);
      jest.spyOn(httpService, 'request').mockReturnValue(throwError(() => new Error('HTTP Error')));
      jest.spyOn(circuitBreaker, 'recordFailure').mockImplementation();

      await expect(
        service.updateReservaStatus(1, EstadoReserva.CONFIRMADO, 123)
      ).rejects.toThrow('HTTP Error');
      
      expect(circuitBreaker.recordFailure).toHaveBeenCalled();
    });
  });

  describe('getAndUpdateReservaStatus', () => {
    it('should get and update reserva status successfully', async () => {
      const updatedReserva = { ...mockReserva, estado: EstadoReserva.CONFIRMADO };
      
      jest.spyOn(service, 'getReservaByCompraId').mockResolvedValue(mockReserva);
      jest.spyOn(service, 'updateReservaStatus').mockResolvedValue(updatedReserva);

      const result = await service.getAndUpdateReservaStatus(
        'COMPRA-123',
        123,
        EstadoReserva.CONFIRMADO
      );

      expect(result).toEqual(updatedReserva);
      expect(service.getReservaByCompraId).toHaveBeenCalledWith('COMPRA-123', 123);
      expect(service.updateReservaStatus).toHaveBeenCalledWith(1, EstadoReserva.CONFIRMADO, 123);
    });

    it('should return null when reserva not found', async () => {
      jest.spyOn(service, 'getReservaByCompraId').mockResolvedValue(null);

      const result = await service.getAndUpdateReservaStatus(
        'COMPRA-NOT-FOUND',
        123,
        EstadoReserva.CONFIRMADO
      );

      expect(result).toBeNull();
      expect(service.updateReservaStatus).not.toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are working', async () => {
      jest.spyOn(cache, 'healthCheck').mockResolvedValue(true);
      jest.spyOn(circuitBreaker, 'getStats').mockReturnValue({
        state: 'CLOSED',
        failureCount: 0,
        threshold: 5,
        lastFailureTime: 0,
        timeSinceLastFailure: 0,
      });

      const result = await service.healthCheck();

      expect(result).toEqual({
        service: 'StockIntegrationService',
        status: 'healthy',
        circuitBreaker: {
          state: 'CLOSED',
          failureCount: 0,
          threshold: 5,
          lastFailureTime: 0,
          timeSinceLastFailure: 0,
        },
        cache: true,
      });
    });

    it('should return unhealthy status when circuit breaker is open', async () => {
      jest.spyOn(cache, 'healthCheck').mockResolvedValue(true);
      jest.spyOn(circuitBreaker, 'getStats').mockReturnValue({
        state: 'OPEN',
        failureCount: 5,
        threshold: 5,
        lastFailureTime: Date.now(),
        timeSinceLastFailure: 0,
      });

      const result = await service.healthCheck();

      expect(result.status).toBe('unhealthy');
    });

    it('should return unhealthy status when cache is not working', async () => {
      jest.spyOn(cache, 'healthCheck').mockResolvedValue(false);
      jest.spyOn(circuitBreaker, 'getStats').mockReturnValue({
        state: 'CLOSED',
        failureCount: 0,
        threshold: 5,
        lastFailureTime: 0,
        timeSinceLastFailure: 0,
      });

      const result = await service.healthCheck();

      expect(result.status).toBe('unhealthy');
    });
  });
});
