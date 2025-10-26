import { Test, TestingModule } from '@nestjs/testing';
import { MockDataService } from './mock-data.service';

describe('MockDataService', () => {
  let service: MockDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockDataService],
    }).compile();

    service = module.get<MockDataService>(MockDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return mock products', () => {
    const products = service.getAllProducts();
    expect(products).toBeDefined();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  it('should get product by id', () => {
    const product = service.getProductById(1);
    expect(product).toBeDefined();
    expect(product.id).toBe(1);
    expect(product.name).toBe('Laptop Gaming');
    expect(product.weight).toBe(2.5);
  });

  it('should return null for non-existent product', () => {
    const product = service.getProductById(999);
    expect(product).toBeUndefined();
  });

  it('should return mock stock info for products', async () => {
    const productIds = [1, 2, 3];
    const stockInfo = await service.getStockInfo(productIds);

    expect(stockInfo).toBeDefined();
    expect(Array.isArray(stockInfo)).toBe(true);
    expect(stockInfo.length).toBe(productIds.length);

    stockInfo.forEach((item, index) => {
      expect(item.id).toBe(productIds[index]);
      expect(item.available).toBeDefined();
      expect(item.weight).toBeDefined();
      expect(item.price).toBeDefined();
    });
  });

  it('should calculate distance between cities', () => {
    const distance = service.calculateDistance('CABA', 'Córdoba');
    expect(distance).toBe(710);
  });

  it('should calculate shipping cost', () => {
    const cost = service.calculateShippingCost(100, 5, 'STANDARD');
    expect(cost).toBeDefined();
    expect(cost.total_cost).toBeGreaterThan(0);
    expect(cost.currency).toBe('ARS');
  });

  it('should generate tracking number', () => {
    const trackingNumber = service.generateTrackingNumber();
    expect(trackingNumber).toBeDefined();
    expect(trackingNumber).toMatch(/^LOG/);
  });
});
