import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { QuoteCacheService } from './quote-cache.service';

describe('QuoteCacheService', () => {
  let service: QuoteCacheService;
  let cacheManager: any;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<QuoteCacheService>(QuoteCacheService);
    cacheManager = module.get(CACHE_MANAGER);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProduct', () => {
    it('should get product from cache', async () => {
      const productId = 1;
      const cachedProduct = { id: 1, name: 'Test Product' };
      
      cacheManager.get.mockResolvedValue(cachedProduct);

      const result = await service.getProduct(productId);
      expect(result).toEqual(cachedProduct);
      expect(cacheManager.get).toHaveBeenCalledWith(`quote:product:${productId}`);
    });

    it('should return null when product not in cache', async () => {
      const productId = 1;
      cacheManager.get.mockResolvedValue(null);

      const result = await service.getProduct(productId);
      expect(result).toBeNull();
    });
  });

  describe('setProduct', () => {
    it('should set product in cache', async () => {
      const productId = 1;
      const product = { id: 1, name: 'Test Product' };
      
      cacheManager.set.mockResolvedValue(undefined);

      await service.setProduct(productId, product);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `quote:product:${productId}`,
        product,
        expect.any(Number)
      );
    });
  });

  describe('getDistance', () => {
    it('should get distance from cache', async () => {
      const fromPostalCode = 'C1000AAA';
      const toPostalCode = 'B1000AAA';
      const cachedDistance = 150.5;
      
      cacheManager.get.mockResolvedValue(cachedDistance);

      const result = await service.getDistance(fromPostalCode, toPostalCode);
      expect(result).toBe(cachedDistance);
      expect(cacheManager.get).toHaveBeenCalledWith(
        `quote:distance:B1000AAA:C1000AAA`
      );
    });

    it('should return null when distance not in cache', async () => {
      const fromPostalCode = 'C1000AAA';
      const toPostalCode = 'B1000AAA';
      
      cacheManager.get.mockResolvedValue(null);

      const result = await service.getDistance(fromPostalCode, toPostalCode);
      expect(result).toBeNull();
    });
  });

  describe('setDistance', () => {
    it('should set distance in cache', async () => {
      const fromPostalCode = 'C1000AAA';
      const toPostalCode = 'B1000AAA';
      const distance = 150.5;
      
      cacheManager.set.mockResolvedValue(undefined);

      await service.setDistance(fromPostalCode, toPostalCode, distance);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `quote:distance:B1000AAA:C1000AAA`,
        distance,
        expect.any(Number)
      );
    });
  });

  describe('clear', () => {
    it('should clear all cache', async () => {
      cacheManager.reset.mockResolvedValue(undefined);

      await service.clear();
      expect(cacheManager.reset).toHaveBeenCalled();
    });
  });
});
