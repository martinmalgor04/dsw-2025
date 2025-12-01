import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

import { StockCircuitBreakerService } from './stock-circuit-breaker.service';
import { StockCacheService } from './stock-cache.service';
import {
  ProductoStockDto,
  ReservaStockDto,
  EstadoReserva,
  CreateReservaDto,
  ReservaProductoDto,
} from '../dto';
import { IStockApiError } from '../interfaces/stock-api.interface';

interface ListReservasOptions {
  usuarioId?: number;
  estado?: EstadoReserva;
  idCompra?: string;
}

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
        undefined,
        { headers: await this.getAuthHeaders() },
      );

      const product = this.mapProductResponse(response.data);
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
   * Lista todos los productos disponibles en Stock API
   */
  async listProducts(): Promise<ProductoStockDto[]> {
    const cacheKey = this.cache.getProductsListKey();
    const cached = await this.cache.get<ProductoStockDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    if (this.circuitBreaker.isOpen()) {
      this.logger.warn(
        'Circuit breaker is OPEN, returning cached/default product list',
      );
      return [];
    }

    try {
      const response = await this.makeRequestWithRetry(
        'GET',
        '/productos',
        undefined,
        { headers: await this.getAuthHeaders() },
      );
      const rawProducts = Array.isArray(response.data)
        ? response.data
        : response.data?.productos ?? [];
      const products = rawProducts.map((item: any) =>
        this.mapProductResponse(item),
      );
      await this.cache.set(cacheKey, products);
      this.circuitBreaker.recordSuccess();
      return products;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logger.error('Error listing products from Stock API', error);
      return [];
    }
  }

  /**
   * Lista reservas con filtros opcionales
   */
  async listReservas(
    options: ListReservasOptions = {},
  ): Promise<ReservaStockDto[]> {
    const cacheKey = this.getReservasCacheKey(options);
    if (cacheKey) {
      const cached = await this.cache.get<ReservaStockDto[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    if (this.circuitBreaker.isOpen()) {
      this.logger.warn('Circuit breaker is OPEN, returning empty reservas list');
      return [];
    }

    try {
      const path = this.buildReservasPath(options);
      const response = await this.makeRequestWithRetry(
        'GET',
        path,
        undefined,
        { headers: await this.getAuthHeaders() },
      );

      const rawReservas = Array.isArray(response.data)
        ? response.data
        : response.data?.reservas ?? [];

      const reservas = rawReservas
        .map((reserva: any) => this.mapReservaResponse(reserva))
        .filter((reserva): reserva is ReservaStockDto => Boolean(reserva));

      const filtered = options.idCompra
        ? reservas.filter((r) => r.idCompra === options.idCompra)
        : reservas;

      if (cacheKey && !options.idCompra && !options.estado) {
        await this.cache.set(cacheKey, filtered);
      }

      this.circuitBreaker.recordSuccess();
      return filtered;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logger.error('Error listing reservas from Stock API', error);
      return [];
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
      const reservas = await this.listReservas({
        usuarioId: userId,
        idCompra: compraId,
      });
      const reserva = reservas[0] ?? null;

      if (reserva) {
        await this.cache.set(cacheKey, reserva);
        await this.cache.set(
          this.cache.getReservaByIdKey(reserva.idReserva, userId),
          reserva,
        );
        this.logger.log(
          `Reserva found for compraId: ${compraId}, reservaId: ${reserva.idReserva}`,
        );
      } else {
        this.logger.warn(
          `No reserva found for compraId: ${compraId}, userId: ${userId}`,
        );
      }

      return reserva;
    } catch (error) {
      this.logger.error(
        `Error retrieving reserva for compraId: ${compraId}`,
        error,
      );
      throw error;
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
        undefined,
        { headers: await this.getAuthHeaders() },
      );

      const reserva = this.mapReservaResponse(response.data);

      if (reserva) {
        await this.cache.set(cacheKey, reserva);
        if (reserva.idCompra) {
          await this.cache.set(
            this.cache.getReservaByCompraKey(reserva.idCompra, userId),
            reserva,
          );
        }
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

      const reserva = this.mapReservaResponse(response.data);

      await this.invalidateReservaListCaches(userId);

      if (reserva) {
        await this.cache.set(
          this.cache.getReservaByIdKey(reservaId, userId),
          reserva,
        );
        if (reserva.idCompra) {
          await this.cache.set(
            this.cache.getReservaByCompraKey(reserva.idCompra, userId),
            reserva,
          );
        }
      } else {
        throw new Error(
          `Stock API did not return reserva data for ${reservaId}`,
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
   * Crea una nueva reserva
   */
  async createReserva(dto: CreateReservaDto): Promise<ReservaStockDto> {
    // Verificar circuit breaker
    if (this.circuitBreaker.isOpen()) {
      throw new Error('Stock service unavailable - circuit breaker is open');
    }

    try {
      const response = await this.makeRequestWithRetry(
        'POST',
        '/reservas',
        dto,
        { headers: await this.getAuthHeaders() },
      );

      const reserva = this.mapReservaResponse(response.data);
      this.circuitBreaker.recordSuccess();
      this.logger.log(
        `Reserva creada exitosamente: ${reserva?.idReserva ?? 'desconocido'}`,
      );

      await this.invalidateReservaListCaches(dto.usuarioId);

      if (reserva?.idReserva) {
        await this.cache.set(
          this.cache.getReservaByIdKey(reserva.idReserva, dto.usuarioId),
          reserva,
        );
      }
      if (reserva?.idCompra) {
        await this.cache.set(
          this.cache.getReservaByCompraKey(reserva.idCompra, dto.usuarioId),
          reserva,
        );
      }

      if (!reserva) {
        throw new Error('Stock API did not return reserva data');
      }

      return reserva;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logger.error('Error creating reserva', error);
      throw error;
    }
  }

  /**
   * Cancela una reserva
   */
  async cancelReserva(reservaId: number, motivo: string): Promise<void> {
    // Verificar circuit breaker
    if (this.circuitBreaker.isOpen()) {
      throw new Error('Stock service unavailable - circuit breaker is open');
    }

    try {
      await this.makeRequestWithRetry(
        'DELETE',
        `/reservas/${reservaId}`,
        { motivo },
        { headers: await this.getAuthHeaders() },
      );

      this.circuitBreaker.recordSuccess();
      this.logger.log(`Reserva ${reservaId} cancelada exitosamente`);

      await this.invalidateReservaListCaches();
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logger.error(`Error cancelling reserva ${reservaId}`, error);
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
    const staticToken =
      this.configService.get<string>('STOCK_API_BEARER_TOKEN') ||
      process.env.STOCK_API_BEARER_TOKEN;

    if (staticToken) {
      return {
        Authorization: `Bearer ${staticToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
    }

    this.logger.warn(
      'STOCK_API_BEARER_TOKEN no configurado, usando token mock para Stock API',
    );

    return {
      Authorization: 'Bearer mock-token',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private mapProductResponse(raw: any): ProductoStockDto {
    if (!raw) {
      return this.getDefaultProduct(Date.now());
    }

    const dimensionesSource =
      raw.dimensiones ||
      raw.producto?.dimensiones || {
        largoCm: 0,
        anchoCm: 0,
        altoCm: 0,
      };

    const ubicacionSource =
      raw.ubicacion ||
      raw.ubicacionAlmacen ||
      raw.location || {
        street: 'Sin calle',
        city: 'Sin ciudad',
        state: 'Sin provincia',
        postal_code: 'H0000AAA',
        country: 'Argentina',
      };

    return {
      id: this.asNumber(raw.id ?? raw.productoId ?? Date.now()),
      nombre: raw.nombre ?? raw.name ?? 'Producto sin nombre',
      descripcion: raw.descripcion ?? raw.description,
      precio: this.asNumber(raw.precio ?? raw.precioUnitario ?? 0),
      stockDisponible: this.asNumber(raw.stockDisponible ?? raw.stock ?? 0),
      pesoKg: this.asNumber(raw.pesoKg ?? raw.peso ?? 0),
      dimensiones: {
        largoCm: this.asNumber(
          dimensionesSource?.largoCm ?? dimensionesSource?.largo ?? 0,
        ),
        anchoCm: this.asNumber(
          dimensionesSource?.anchoCm ?? dimensionesSource?.ancho ?? 0,
        ),
        altoCm: this.asNumber(
          dimensionesSource?.altoCm ?? dimensionesSource?.alto ?? 0,
        ),
      },
      ubicacion: {
        street: ubicacionSource?.street ?? ubicacionSource?.calle ?? 'Sin calle',
        city: ubicacionSource?.city ?? ubicacionSource?.ciudad ?? 'Sin ciudad',
        state:
          ubicacionSource?.state ?? ubicacionSource?.provincia ?? 'Sin provincia',
        postal_code:
          ubicacionSource?.postal_code ??
          ubicacionSource?.codigoPostal ??
          'H0000AAA',
        country:
          ubicacionSource?.country ?? ubicacionSource?.pais ?? 'Argentina',
      },
      imagenes: Array.isArray(raw.imagenes)
        ? raw.imagenes.map((imagen: any) => ({
            url: imagen.url ?? '',
            esPrincipal: Number(
              typeof imagen.esPrincipal === 'boolean'
                ? imagen.esPrincipal
                : imagen.esPrincipal ?? 0,
            ),
          }))
        : undefined,
      categorias: Array.isArray(raw.categorias)
        ? raw.categorias.map((categoria: any) => ({
            id: this.asNumber(categoria.id ?? Date.now()),
            nombre: categoria.nombre ?? 'Sin categoría',
            descripcion: categoria.descripcion,
          }))
        : undefined,
    };
  }

  private mapReservaResponse(raw: any): ReservaStockDto | null {
    if (!raw) {
      return null;
    }

    const productos = Array.isArray(raw.items)
      ? raw.items.map((item: any) => this.mapReservaProducto(item))
      : [];

    return {
      idReserva: this.asNumber(raw.idReserva ?? raw.id ?? Date.now()),
      idCompra: raw.idCompra ?? raw.compraId ?? '',
      usuarioId: this.asNumber(raw.usuarioId ?? raw.userId ?? 0),
      estado: this.normalizeEstado(raw.estado),
      expiresAt: this.normalizeIsoDate(raw.expiraEn ?? raw.expiresAt),
      fechaCreacion: this.normalizeIsoDate(
        raw.fechaCreacion ?? raw.createdAt ?? raw.fechaCreado,
      ),
      fechaActualizacion: this.normalizeIsoDate(
        raw.fechaActualizacion ?? raw.updatedAt ?? raw.fechaActualizado,
      ),
      productos,
    };
  }

  private mapReservaProducto(item: any): ReservaProductoDto {
    const dimensionesSource =
      item.dimensiones || item.producto?.dimensiones || null;

    const producto: ReservaProductoDto = {
      idProducto: this.asNumber(item.productoId ?? item.idProducto ?? item.id),
      nombre: item.nombre ?? item.producto?.nombre ?? 'Producto sin nombre',
      cantidad: this.asNumber(item.cantidad ?? item.quantity ?? 0),
      precioUnitario: this.asNumber(
        item.precioUnitario ?? item.precio ?? item.producto?.precio ?? 0,
      ),
    };

    if (dimensionesSource) {
      producto.dimensiones = {
        largoCm: this.asNumber(
          dimensionesSource.largoCm ?? dimensionesSource.largo ?? 0,
        ),
        anchoCm: this.asNumber(
          dimensionesSource.anchoCm ?? dimensionesSource.ancho ?? 0,
        ),
        altoCm: this.asNumber(
          dimensionesSource.altoCm ?? dimensionesSource.alto ?? 0,
        ),
      };
    }

    return producto;
  }

  private normalizeEstado(estado: string | undefined): EstadoReserva {
    const normalized = (estado || '').toLowerCase();
    switch (normalized) {
      case EstadoReserva.CONFIRMADO:
        return EstadoReserva.CONFIRMADO;
      case EstadoReserva.CANCELADO:
        return EstadoReserva.CANCELADO;
      default:
        return EstadoReserva.PENDIENTE;
    }
  }

  private asNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private normalizeIsoDate(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }

  private getReservasCacheKey(
    options: ListReservasOptions,
  ): string | null {
    if (options.idCompra || options.estado) {
      return null;
    }
    if (typeof options.usuarioId === 'number') {
      return this.cache.getReservasListKey(options.usuarioId);
    }
    return this.cache.getReservasListKey();
  }

  private buildReservasPath(options: ListReservasOptions): string {
    const params = new URLSearchParams();
    if (typeof options.usuarioId === 'number') {
      params.set('usuarioId', String(options.usuarioId));
    }
    if (options.estado) {
      params.set('estado', options.estado.toUpperCase());
    }
    if (options.idCompra) {
      params.set('idCompra', options.idCompra);
    }
    const query = params.toString();
    return query ? `/reservas?${query}` : '/reservas';
  }

  private async invalidateReservaListCaches(
    userId?: number,
  ): Promise<void> {
    await this.cache.delete(this.cache.getReservasListKey());
    if (typeof userId === 'number') {
      await this.cache.delete(this.cache.getReservasListKey(userId));
    }
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
