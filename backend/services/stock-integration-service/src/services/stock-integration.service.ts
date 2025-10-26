import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

import { StockCircuitBreakerService } from './stock-circuit-breaker.service';
import { StockCacheService } from './stock-cache.service';
import { ProductoStockDto, ReservaStockDto, EstadoReserva } from '../dto';
import { IStockApiError } from '../interfaces/stock-api.interface';

@Injectable()
export class StockIntegrationService {
  private readonly logger = new Logger(StockIntegrationService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly circuitBreaker: StockCircuitBreakerService,
    private readonly cache: StockCacheService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'STOCK_API_URL',
      'https://stock.ds.frre.utn.edu.ar/v1',
    );
    this.logger.log(
      `Stock Integration Service initialized with base URL: ${this.baseUrl}`,
    );
  }

  /**
   * Obtiene un producto por ID
   */
  async getProductById(productId: number): Promise<ProductoStockDto> {
    const cacheKey = this.cache.getProductKey(productId);

    // Verificar caché
    const cached = await this.cache.get<ProductoStockDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Product ${productId} found in cache`);
      return cached;
    }

    // Verificar circuit breaker
    if (this.circuitBreaker.isOpen()) {
      this.logger.warn(
        `Circuit breaker is OPEN, returning default product for ID: ${productId}`,
      );
      return this.getDefaultProduct(productId);
    }

    try {
      const response = await this.makeRequestWithRetry(
        'GET',
        `/productos/${productId}`,
        { headers: await this.getAuthHeaders() },
      );

      const product = response.data;
      await this.cache.set(cacheKey, product);
      this.circuitBreaker.recordSuccess();

      this.logger.log(
        `Product ${productId} retrieved successfully from Stock API`,
      );
      return product;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logger.error(
        `Error retrieving product ${productId} from Stock API`,
        error,
      );
      return this.getDefaultProduct(productId);
    }
  }

  /**
   * Obtiene una reserva por ID de compra
   */
  async getReservaByCompraId(
    compraId: string,
    userId: number,
  ): Promise<ReservaStockDto | null> {
    const cacheKey = this.cache.getReservaByCompraKey(compraId, userId);

    // Verificar caché
    const cached = await this.cache.get<ReservaStockDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Reserva for compraId ${compraId} found in cache`);
      return cached;
    }

    // Verificar circuit breaker
    if (this.circuitBreaker.isOpen()) {
      this.logger.warn(
        `Circuit breaker is OPEN, returning null for compraId: ${compraId}`,
      );
      return null;
    }

    try {
      // 1. Listar todas las reservas del usuario
      const response = await this.makeRequestWithRetry(
        'GET',
        `/reservas?usuarioId=${userId}`,
        { headers: await this.getAuthHeaders() },
      );

      const reservas = response.data;
      // 2. Buscar la reserva que coincida con el idCompra
      const reserva = reservas.find(
        (r: ReservaStockDto) => r.idCompra === compraId,
      );

      if (reserva) {
        // 3. Guardar en caché usando idCompra como clave
        await this.cache.set(cacheKey, reserva);
        this.logger.log(
          `Reserva found for compraId: ${compraId}, reservaId: ${reserva.idReserva}`,
        );
      } else {
        this.logger.warn(
          `No reserva found for compraId: ${compraId}, userId: ${userId}`,
        );
      }

      this.circuitBreaker.recordSuccess();
      return reserva || null;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logger.error(
        `Error retrieving reserva for compraId: ${compraId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Obtiene una reserva por ID de reserva
   */
  async getReservaById(
    reservaId: number,
    userId: number,
  ): Promise<ReservaStockDto | null> {
    const cacheKey = this.cache.getReservaByIdKey(reservaId, userId);

    // Verificar caché
    const cached = await this.cache.get<ReservaStockDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Reserva ${reservaId} found in cache`);
      return cached;
    }

    // Verificar circuit breaker
    if (this.circuitBreaker.isOpen()) {
      this.logger.warn(
        `Circuit breaker is OPEN, returning null for reservaId: ${reservaId}`,
      );
      return null;
    }

    try {
      const response = await this.makeRequestWithRetry(
        'GET',
        `/reservas/${reservaId}?usuarioId=${userId}`,
        { headers: await this.getAuthHeaders() },
      );

      const reserva = response.data;

      if (reserva) {
        await this.cache.set(cacheKey, reserva);
        this.logger.log(
          `Reserva ${reservaId} retrieved successfully from Stock API`,
        );
      }

      this.circuitBreaker.recordSuccess();
      return reserva || null;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logger.error(
        `Error retrieving reserva ${reservaId} from Stock API`,
        error,
      );
      return null;
    }
  }

  /**
   * Actualiza el estado de una reserva
   */
  async updateReservaStatus(
    reservaId: number,
    estado: EstadoReserva,
    userId: number,
  ): Promise<ReservaStockDto> {
    // Verificar circuit breaker
    if (this.circuitBreaker.isOpen()) {
      throw new Error('Stock service unavailable - circuit breaker is open');
    }

    try {
      const response = await this.makeRequestWithRetry(
        'PATCH',
        `/reservas/${reservaId}`,
        {
          usuarioId: userId,
          estado: estado,
        },
        { headers: await this.getAuthHeaders() },
      );

      const reserva = response.data;

      // Invalidar caché usando idCompra (si lo tenemos)
      if (reserva.idCompra) {
        await this.cache.delete(
          this.cache.getReservaByCompraKey(reserva.idCompra, userId),
        );
      }

      this.circuitBreaker.recordSuccess();
      this.logger.log(`Reserva ${reservaId} updated to estado: ${estado}`);
      return reserva;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logger.error(
        `Error updating reserva ${reservaId} to estado: ${estado}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Método helper: Obtener y actualizar reserva
   */
  async getAndUpdateReservaStatus(
    compraId: string,
    userId: number,
    nuevoEstado: EstadoReserva,
  ): Promise<ReservaStockDto | null> {
    try {
      // 1. Buscar reserva por idCompra
      const reserva = await this.getReservaByCompraId(compraId, userId);

      if (!reserva) {
        this.logger.warn(
          `Reserva no encontrada para compraId: ${compraId}, userId: ${userId}`,
        );
        return null;
      }

      // 2. Actualizar estado usando idReserva
      const reservaActualizada = await this.updateReservaStatus(
        reserva.idReserva,
        nuevoEstado,
        userId,
      );

      this.logger.log(
        `Reserva ${reserva.idReserva} actualizada a estado: ${nuevoEstado}`,
      );
      return reservaActualizada;
    } catch (error) {
      this.logger.error(
        `Error al actualizar reserva para compraId: ${compraId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Realiza una request con reintentos automáticos
   */
  private async makeRequestWithRetry(
    method: string,
    url: string,
    data?: any,
    config?: any,
  ): Promise<AxiosResponse> {
    const maxRetries = this.configService.get<number>(
      'STOCK_API_RETRY_ATTEMPTS',
      3,
    );
    const baseDelay = this.configService.get<number>(
      'STOCK_API_RETRY_DELAY',
      1000,
    );

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const requestConfig = {
          method,
          url: `${this.baseUrl}${url}`,
          data,
          ...config,
        };

        this.logger.debug(
          `Making request to ${method} ${url} (attempt ${attempt}/${maxRetries})`,
        );

        const response = await firstValueFrom(
          this.httpService.request(requestConfig),
        );
        return response;
      } catch (error) {
        this.logger.warn(
          `Request failed (attempt ${attempt}/${maxRetries}): ${error.message}`,
        );

        if (attempt === maxRetries) {
          // Último intento fallido: relanzar error
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        this.logger.debug(`Waiting ${delay}ms before retry...`);
        await this.sleep(delay);
      }
    }

    // TypeScript: esta línea no debería ser alcanzable debido al 'throw' anterior
    // pero se agrega para satisfacer el chequeo estricto de retorno.
    throw new Error(
      'Unreachable: makeRequestWithRetry exhausted without throwing',
    );
  }

  /**
   * Obtiene headers de autenticación
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    // TODO: Implementar obtención de token JWT desde Keycloak
    // Por ahora retornamos headers básicos
    return {
      Authorization: 'Bearer mock-token', // Temporal
      'Content-Type': 'application/json',
    };
  }

  /**
   * Obtiene un producto por defecto cuando Stock API no está disponible
   */
  private getDefaultProduct(productId: number): ProductoStockDto {
    return {
      id: productId,
      nombre: 'Producto No Disponible',
      descripcion: 'Producto temporalmente no disponible',
      precio: 0,
      stockDisponible: 0,
      pesoKg: 1.0,
      dimensiones: {
        largoCm: 10,
        anchoCm: 10,
        altoCm: 10,
      },
      ubicacion: {
        street: 'Calle Default',
        city: 'Ciudad Default',
        state: 'Provincia Default',
        postal_code: 'H3500ABC',
        country: 'Argentina',
      },
    };
  }

  /**
   * Utilidad para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<{
    service: string;
    status: 'healthy' | 'unhealthy';
    circuitBreaker: any;
    cache: boolean;
  }> {
    const cacheHealthy = await this.cache.healthCheck();
    const circuitBreakerStats = this.circuitBreaker.getStats();

    return {
      service: 'StockIntegrationService',
      status:
        cacheHealthy && circuitBreakerStats.state !== 'OPEN'
          ? 'healthy'
          : 'unhealthy',
      circuitBreaker: circuitBreakerStats,
      cache: cacheHealthy,
    };
  }
}
