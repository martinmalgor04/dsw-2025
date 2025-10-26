import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class StockCacheService {
  private readonly logger = new Logger(StockCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Obtiene un valor del caché
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT for key: ${key}`);
      } else {
        this.logger.debug(`Cache MISS for key: ${key}`);
      }
      return value || null;
    } catch (error) {
      this.logger.error(`Error getting from cache for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Guarda un valor en el caché
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET for key: ${key}, ttl: ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Error setting cache for key: ${key}`, error);
    }
  }

  /**
   * Elimina un valor del caché
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DELETE for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting from cache for key: ${key}`, error);
    }
  }

  /**
   * Limpia todo el caché
   */
  async clear(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.debug('Cache CLEARED');
    } catch (error) {
      this.logger.error('Error clearing cache', error);
    }
  }

  /**
   * Genera claves estructuradas para productos
   */
  getProductKey(productId: number): string {
    return `stock:product:${productId}`;
  }

  /**
   * Genera claves estructuradas para reservas por ID de compra
   */
  getReservaByCompraKey(compraId: string, userId: number): string {
    return `stock:reserva:${compraId}:${userId}`;
  }

  /**
   * Genera claves estructuradas para reservas por ID de reserva
   */
  getReservaByIdKey(reservaId: number, userId: number): string {
    return `stock:reserva:${reservaId}:${userId}`;
  }

  /**
   * Health check del caché
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health:check';
      const testValue = 'ok';

      await this.set(testKey, testValue, 10);
      const retrieved = await this.get<string>(testKey);
      await this.delete(testKey);

      return retrieved === testValue;
    } catch (error) {
      this.logger.error('Cache health check failed', error);
      return false;
    }
  }
}
