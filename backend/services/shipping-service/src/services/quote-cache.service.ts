import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuoteCacheService {
  private readonly logger = new Logger(QuoteCacheService.name);
  private readonly productCacheTTL: number;
  private readonly distanceCacheTTL: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.productCacheTTL = parseInt(
      this.configService.get<string>('PRODUCT_CACHE_TTL', '600'),
      10,
    );
    this.distanceCacheTTL = parseInt(
      this.configService.get<string>('DISTANCE_CACHE_TTL', '3600'),
      10,
    );
  }

  async getProduct<T>(productId: number): Promise<T | null> {
    try {
      const key = this.getProductKey(productId);
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT for product: ${productId}`);
        return value;
      }
      this.logger.debug(`Cache MISS for product: ${productId}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting product ${productId} from cache`, error);
      return null;
    }
  }

  async setProduct(productId: number, value: any): Promise<void> {
    try {
      const key = this.getProductKey(productId);
      await this.cacheManager.set(key, value, this.productCacheTTL);
      this.logger.debug(
        `Cache SET for product: ${productId} with TTL: ${this.productCacheTTL}s`,
      );
    } catch (error) {
      this.logger.error(`Error setting product ${productId} in cache`, error);
    }
  }

  async getDistance(
    fromPostalCode: string,
    toPostalCode: string,
  ): Promise<number | null> {
    try {
      const key = this.getDistanceKey(fromPostalCode, toPostalCode);
      const value = await this.cacheManager.get<number>(key);
      if (value !== undefined && value !== null) {
        this.logger.debug(
          `Cache HIT for distance: ${fromPostalCode} -> ${toPostalCode}`,
        );
        return value;
      }
      this.logger.debug(
        `Cache MISS for distance: ${fromPostalCode} -> ${toPostalCode}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Error getting distance from cache: ${fromPostalCode} -> ${toPostalCode}`,
        error,
      );
      return null;
    }
  }

  async setDistance(
    fromPostalCode: string,
    toPostalCode: string,
    distance: number,
  ): Promise<void> {
    try {
      const key = this.getDistanceKey(fromPostalCode, toPostalCode);
      await this.cacheManager.set(key, distance, this.distanceCacheTTL);
      this.logger.debug(
        `Cache SET for distance: ${fromPostalCode} -> ${toPostalCode} = ${distance}km with TTL: ${this.distanceCacheTTL}s`,
      );
    } catch (error) {
      this.logger.error(
        `Error setting distance in cache: ${fromPostalCode} -> ${toPostalCode}`,
        error,
      );
    }
  }

  async deleteProduct(productId: number): Promise<void> {
    try {
      const key = this.getProductKey(productId);
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DELETE for product: ${productId}`);
    } catch (error) {
      this.logger.error(
        `Error deleting product ${productId} from cache`,
        error,
      );
    }
  }

  async deleteDistance(
    fromPostalCode: string,
    toPostalCode: string,
  ): Promise<void> {
    try {
      const key = this.getDistanceKey(fromPostalCode, toPostalCode);
      await this.cacheManager.del(key);
      this.logger.debug(
        `Cache DELETE for distance: ${fromPostalCode} -> ${toPostalCode}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting distance from cache: ${fromPostalCode} -> ${toPostalCode}`,
        error,
      );
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.debug('Cache CLEAR successful');
    } catch (error) {
      this.logger.error('Error clearing cache', error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health:check';
      const testValue = 'ok';
      await this.cacheManager.set(testKey, testValue, 1);
      const value = await this.cacheManager.get(testKey);
      return value === testValue;
    } catch (error) {
      this.logger.error('Cache health check failed', error);
      return false;
    }
  }

  getStats() {
    return {
      productCacheTTL: this.productCacheTTL,
      distanceCacheTTL: this.distanceCacheTTL,
    };
  }

  private getProductKey(productId: number): string {
    return `quote:product:${productId}`;
  }

  private getDistanceKey(fromPostalCode: string, toPostalCode: string): string {
    const sorted = [fromPostalCode, toPostalCode].sort();
    return `quote:distance:${sorted[0]}:${sorted[1]}`;
  }
}
