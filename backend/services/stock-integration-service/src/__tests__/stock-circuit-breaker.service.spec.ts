import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StockCircuitBreakerService } from '../services/stock-circuit-breaker.service';

describe('StockCircuitBreakerService', () => {
  let service: StockCircuitBreakerService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockCircuitBreakerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                STOCK_CIRCUIT_BREAKER_THRESHOLD: 5,
                STOCK_CIRCUIT_BREAKER_TIMEOUT: 30000,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StockCircuitBreakerService>(
      StockCircuitBreakerService,
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(service.getState()).toBe('CLOSED');
      expect(service.getFailureCount()).toBe(0);
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('recordSuccess', () => {
    it('should reset failure count on success', () => {
      // Simular algunos fallos
      service.recordFailure();
      service.recordFailure();
      expect(service.getFailureCount()).toBe(2);

      // Registrar éxito
      service.recordSuccess();
      expect(service.getFailureCount()).toBe(0);
      expect(service.getState()).toBe('CLOSED');
    });

    it('should transition from HALF_OPEN to CLOSED on success', () => {
      // Forzar estado HALF_OPEN
      (service as any).state = 'HALF_OPEN';
      (service as any).failureCount = 3;

      service.recordSuccess();
      expect(service.getState()).toBe('CLOSED');
      expect(service.getFailureCount()).toBe(0);
    });
  });

  describe('recordFailure', () => {
    it('should increment failure count', () => {
      expect(service.getFailureCount()).toBe(0);

      service.recordFailure();
      expect(service.getFailureCount()).toBe(1);

      service.recordFailure();
      expect(service.getFailureCount()).toBe(2);
    });

    it('should transition to OPEN state after threshold failures', () => {
      expect(service.getState()).toBe('CLOSED');

      // Registrar 5 fallos (umbral por defecto)
      for (let i = 0; i < 5; i++) {
        service.recordFailure();
      }

      expect(service.getState()).toBe('OPEN');
      expect(service.getFailureCount()).toBe(5);
    });

    it('should not transition to OPEN before threshold', () => {
      expect(service.getState()).toBe('CLOSED');

      // Registrar 4 fallos (menos que el umbral)
      for (let i = 0; i < 4; i++) {
        service.recordFailure();
      }

      expect(service.getState()).toBe('CLOSED');
      expect(service.getFailureCount()).toBe(4);
    });
  });

  describe('isOpen', () => {
    it('should return false when circuit breaker is CLOSED', () => {
      expect(service.getState()).toBe('CLOSED');
      expect(service.isOpen()).toBe(false);
    });

    it('should return true when circuit breaker is OPEN', () => {
      // Forzar estado OPEN
      (service as any).state = 'OPEN';
      (service as any).lastFailureTime = Date.now();

      expect(service.isOpen()).toBe(true);
    });

    it('should transition from OPEN to HALF_OPEN after timeout', () => {
      // Forzar estado OPEN con timestamp antiguo
      (service as any).state = 'OPEN';
      (service as any).lastFailureTime = Date.now() - 35000; // 35 segundos atrás

      expect(service.isOpen()).toBe(false);
      expect(service.getState()).toBe('HALF_OPEN');
    });

    it('should return false when circuit breaker is HALF_OPEN', () => {
      (service as any).state = 'HALF_OPEN';
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker to initial state', () => {
      // Simular estado con fallos
      service.recordFailure();
      service.recordFailure();
      service.recordFailure();
      service.recordFailure();
      service.recordFailure(); // Esto debería abrir el circuit breaker

      expect(service.getState()).toBe('OPEN');
      expect(service.getFailureCount()).toBe(5);

      // Resetear
      service.reset();

      expect(service.getState()).toBe('CLOSED');
      expect(service.getFailureCount()).toBe(0);
      expect(service.getLastFailureTime()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return current statistics', () => {
      service.recordFailure();
      service.recordFailure();

      const stats = service.getStats();

      expect(stats).toEqual({
        state: 'CLOSED',
        failureCount: 2,
        threshold: 5,
        lastFailureTime: expect.any(Number),
        timeSinceLastFailure: expect.any(Number),
      });
    });
  });

  describe('timeout behavior', () => {
    it('should handle timeout correctly', () => {
      // Forzar estado OPEN
      (service as any).state = 'OPEN';
      (service as any).lastFailureTime = Date.now() - 1000; // 1 segundo atrás

      // Debería seguir abierto (timeout es 30 segundos)
      expect(service.isOpen()).toBe(true);

      // Simular que pasó el timeout
      (service as any).lastFailureTime = Date.now() - 35000; // 35 segundos atrás

      // Debería transicionar a HALF_OPEN
      expect(service.isOpen()).toBe(false);
      expect(service.getState()).toBe('HALF_OPEN');
    });
  });
});
