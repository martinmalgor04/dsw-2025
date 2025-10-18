import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { StockCacheService } from '../services/stock-cache.service';

describe('StockCacheService', () => {
  let service: StockCacheService;
  let cacheManager: any;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<StockCacheService>(StockCacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when available', async () => {
      const mockValue = { id: 1, name: 'test' };
      cacheManager.get.mockResolvedValue(mockValue);

      const result = await service.get('test-key');

      expect(result).toEqual(mockValue);
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when value not found', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when cache throws error', async () => {
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      const mockValue = { id: 1, name: 'test' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', mockValue);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', mockValue, undefined);
    });

    it('should set value with TTL', async () => {
      const mockValue = { id: 1, name: 'test' };
      const ttl = 300;
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', mockValue, ttl);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', mockValue, ttl);
    });

    it('should handle cache errors gracefully', async () => {
      const mockValue = { id: 1, name: 'test' };
      cacheManager.set.mockRejectedValue(new Error('Cache error'));

      // No debería lanzar error
      await expect(service.set('test-key', mockValue)).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete value from cache', async () => {
      cacheManager.del.mockResolvedValue(undefined);

      await service.delete('test-key');

      expect(cacheManager.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle cache errors gracefully', async () => {
      cacheManager.del.mockRejectedValue(new Error('Cache error'));

      // No debería lanzar error
      await expect(service.delete('test-key')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cache', async () => {
      cacheManager.reset.mockResolvedValue(undefined);

      await service.clear();

      expect(cacheManager.reset).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      cacheManager.reset.mockRejectedValue(new Error('Cache error'));

      // No debería lanzar error
      await expect(service.clear()).resolves.not.toThrow();
    });
  });

  describe('key generation', () => {
    it('should generate correct product key', () => {
      const key = service.getProductKey(123);
      expect(key).toBe('stock:product:123');
    });

    it('should generate correct reserva by compra key', () => {
      const key = service.getReservaByCompraKey('COMPRA-123', 456);
      expect(key).toBe('stock:reserva:COMPRA-123:456');
    });

    it('should generate correct reserva by id key', () => {
      const key = service.getReservaByIdKey(789, 456);
      expect(key).toBe('stock:reserva:789:456');
    });
  });

  describe('healthCheck', () => {
    it('should return true when cache is working', async () => {
      cacheManager.set.mockResolvedValue(undefined);
      cacheManager.get.mockResolvedValue('ok');
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(cacheManager.set).toHaveBeenCalledWith('health:check', 'ok', 10);
      expect(cacheManager.get).toHaveBeenCalledWith('health:check');
      expect(cacheManager.del).toHaveBeenCalledWith('health:check');
    });

    it('should return false when cache is not working', async () => {
      cacheManager.set.mockRejectedValue(new Error('Cache error'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when retrieved value is incorrect', async () => {
      cacheManager.set.mockResolvedValue(undefined);
      cacheManager.get.mockResolvedValue('wrong-value');
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
