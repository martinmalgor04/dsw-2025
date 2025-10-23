# RF-002: Integración con Stock (Cliente HTTP)

## 📋 **Información General**

- **ID**: RF-002
- **Título**: Integración con Stock (Cliente HTTP)
- **Prioridad**: P0 (CRÍTICO)
- **Complejidad**: Alta
- **Responsable**: Backend Team
- **Dependencias**: RF-001 (Servicio de Configuración Base)

## 🎯 **Objetivo**

Implementar un cliente HTTP robusto para consumir la API de Stock con manejo de errores, reintentos automáticos, circuit breaker y caché en Redis. Este servicio permitirá a Logística obtener información de productos (peso, dimensiones, depósito) y gestionar reservas de stock.

## 📊 **Criterios de Aceptación**

### ✅ **Funcionalidades Principales**
1. **Cliente HTTP nativo de NestJS** para comunicación con Stock API
2. **Reintentos automáticos** con backoff exponencial (3 intentos: 1s, 2s, 4s)
3. **Circuit breaker** que abre tras 5 fallos consecutivos
4. **Timeout de 2 segundos** por request
5. **Fallback a valores por defecto** si Stock no responde
6. **Caché de respuestas en Redis** con TTL de 10 minutos

### ✅ **Funciones Principales**
1. **Consultar datos de producto** (peso, dimensiones, depósito)
2. **Validar existencia de reserva** por ID de compra
3. **Gestionar estados de reserva** (pendiente, confirmado, cancelado)

### ✅ **Testing**
1. **Tests unitarios** con mocks simulando respuestas de Stock
2. **Tests de integración** con OpenAPI de Stock (cuando esté disponible)

## 🔗 **Integración con APIs Externas**

### **Stock API** (`https://stock.ds.frre.utn.edu.ar/v1`)

#### **Endpoints a Consumir:**

1. **GET /productos/{productoId}**
   - **Propósito**: Obtener información completa del producto
   - **Autenticación**: OAuth2 con scope `productos:read`
   - **Respuesta**: Producto con peso, dimensiones, ubicación del almacén
   - **Uso**: Calcular costos de envío y volumen

2. **GET /reservas?usuarioId={userId}**
   - **Propósito**: Listar reservas de un usuario
   - **Autenticación**: OAuth2 con scope `reservas:read`
   - **Parámetros**: usuarioId (requerido), estado (opcional), paginación
   - **Respuesta**: Array de reservas con idCompra, idReserva, estado, productos
   - **Uso**: Buscar reserva por idCompra y obtener idReserva

3. **GET /reservas/{idReserva}?usuarioId={userId}**
   - **Propósito**: Obtener detalles de una reserva específica
   - **Autenticación**: OAuth2 con scope `reservas:read`
   - **Parámetros**: idReserva (path), usuarioId (query requerido)
   - **Uso**: Obtener detalles completos de una reserva específica

4. **PATCH /reservas/{idReserva}**
   - **Propósito**: Actualizar estado de reserva
   - **Autenticación**: OAuth2 con scope `reservas:write`
   - **Body**: { usuarioId: number, estado: 'confirmado' | 'pendiente' | 'cancelado' }
   - **Uso**: Cambiar estado cuando se procesa el envío

#### **Estructura de Datos Esperada:**

```typescript
// Producto desde Stock API
interface ProductoStock {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stockDisponible: number;
  pesoKg: number;                    // Para cálculo de peso
  dimensiones: {                     // Para cálculo de volumen
    largoCm: number;
    anchoCm: number;
    altoCm: number;
  };
  ubicacion: {                       // Para cálculo de distancia
    street: string;
    city: string;
    state: string;
    postal_code: string;             // Formato CPA: H3500ABC
    country: string;
  };
  imagenes?: Array<{
    url: string;
    esPrincipal: boolean;
  }>;
  categorias?: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
  }>;
}

// Reserva desde Stock API
interface ReservaStock {
  idReserva: number;
  idCompra: string;                  // ID de compra del sistema externo
  usuarioId: number;
  estado: 'confirmado' | 'pendiente' | 'cancelado';
  expiresAt: string;                 // ISO 8601
  fechaCreacion: string;             // ISO 8601
  fechaActualizacion: string;        // ISO 8601
  productos: Array<{
    idProducto: number;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }>;
}
```

## 🏗️ **Arquitectura del Servicio**

### **Módulo: StockIntegrationModule**

```typescript
@Module({
  imports: [
    HttpModule.register({
      timeout: 2000,
      maxRedirects: 3,
    }),
    ConfigModule,
    CacheModule.register({
      ttl: 600, // 10 minutos
      max: 1000,
    }),
  ],
  providers: [
    StockIntegrationService,
    StockCircuitBreakerService,
    StockCacheService,
  ],
  exports: [StockIntegrationService],
})
export class StockIntegrationModule {}
```

### **Servicios Principales:**

1. **StockIntegrationService**
   - Cliente HTTP principal
   - Manejo de autenticación JWT
   - Lógica de reintentos
   - Integración con circuit breaker

2. **StockCircuitBreakerService**
   - Implementación de circuit breaker
   - Estados: CLOSED, OPEN, HALF_OPEN
   - Umbral: 5 fallos consecutivos
   - Timeout de recuperación: 30 segundos

3. **StockCacheService**
   - Caché de respuestas en Redis
   - TTL: 10 minutos
   - Claves: `stock:product:{id}`, `stock:reserva:{id}`

## 🔧 **Configuración**

### **Variables de Entorno:**

```bash
# Stock API Configuration
STOCK_API_URL=https://stock.ds.frre.utn.edu.ar/v1
STOCK_API_TIMEOUT=2000
STOCK_API_RETRY_ATTEMPTS=3
STOCK_API_RETRY_DELAY=1000

# Circuit Breaker Configuration
STOCK_CIRCUIT_BREAKER_THRESHOLD=5
STOCK_CIRCUIT_BREAKER_TIMEOUT=30000

# Cache Configuration
STOCK_CACHE_TTL=600
STOCK_CACHE_MAX_ITEMS=1000

# OAuth2 Configuration (Keycloak)
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM=ds-2025-realm
KEYCLOAK_CLIENT_ID=logistica-service
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

### **Configuración de Cliente HTTP:**

```typescript
@Injectable()
export class StockIntegrationService {
  private readonly httpClient: HttpService;
  private readonly circuitBreaker: StockCircuitBreakerService;
  private readonly cache: StockCacheService;

  constructor(
    httpService: HttpService,
    circuitBreaker: StockCircuitBreakerService,
    cache: StockCacheService,
    private configService: ConfigService,
  ) {
    this.httpClient = httpService;
    this.circuitBreaker = circuitBreaker;
    this.cache = cache;
  }

  // Implementación de métodos...
}
```

## 🔄 **Flujo de Trabajo con Reservas**

### **Flujo Completo:**

1. **Obtener ID de Reserva por ID de Compra:**
   ```typescript
   // 1. Listar reservas del usuario
   const reservas = await stockService.getReservasByUsuario(userId);
   
   // 2. Buscar por idCompra
   const reserva = reservas.find(r => r.idCompra === "COMPRA-XYZ-12345");
   
   // 3. Obtener idReserva para usar en operaciones posteriores
   const idReserva = reserva.idReserva;
   ```

2. **Obtener Detalles de Reserva:**
   ```typescript
   // Usar el idReserva obtenido anteriormente
   const reservaDetalle = await stockService.getReservaById(idReserva, userId);
   ```

3. **Actualizar Estado de Reserva:**
   ```typescript
   // Cambiar estado cuando se procesa el envío
   await stockService.updateReservaStatus(idReserva, 'confirmado', userId);
   ```

### **Estados de Reserva:**
- **`pendiente`**: Reserva creada, esperando procesamiento
- **`confirmado`**: Reserva confirmada, productos reservados
- **`cancelado`**: Reserva cancelada, stock liberado

## 🚀 **Métodos Principales**

### **1. Obtener Producto por ID**

```typescript
async getProductById(productId: number): Promise<ProductoStock> {
  const cacheKey = `stock:product:${productId}`;
  
  // Verificar caché
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  // Verificar circuit breaker
  if (this.circuitBreaker.isOpen()) {
    return this.getDefaultProduct(productId);
  }

  try {
    const response = await this.makeRequestWithRetry(
      'GET',
      `/productos/${productId}`,
      { headers: await this.getAuthHeaders() }
    );

    const product = response.data;
    await this.cache.set(cacheKey, product);
    this.circuitBreaker.recordSuccess();
    
    return product;
  } catch (error) {
    this.circuitBreaker.recordFailure();
    return this.getDefaultProduct(productId);
  }
}
```

### **2. Obtener Reserva por ID de Compra**

```typescript
async getReservaByCompraId(compraId: string, userId: number): Promise<ReservaStock | null> {
  const cacheKey = `stock:reserva:${compraId}:${userId}`;
  
  // Verificar caché
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  // Verificar circuit breaker
  if (this.circuitBreaker.isOpen()) {
    return null;
  }

  try {
    // 1. Listar todas las reservas del usuario
    const response = await this.makeRequestWithRetry(
      'GET',
      `/reservas?usuarioId=${userId}`,
      { headers: await this.getAuthHeaders() }
    );

    const reservas = response.data;
    // 2. Buscar la reserva que coincida con el idCompra
    const reserva = reservas.find(r => r.idCompra === compraId);
    
    if (reserva) {
      // 3. Guardar en caché usando idCompra como clave
      await this.cache.set(cacheKey, reserva);
    }
    
    this.circuitBreaker.recordSuccess();
    return reserva || null;
  } catch (error) {
    this.circuitBreaker.recordFailure();
    return null;
  }
}
```

### **3. Obtener Reserva por ID de Reserva**

```typescript
async getReservaById(reservaId: number, userId: number): Promise<ReservaStock | null> {
  const cacheKey = `stock:reserva:${reservaId}:${userId}`;
  
  // Verificar caché
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  // Verificar circuit breaker
  if (this.circuitBreaker.isOpen()) {
    return null;
  }

  try {
    const response = await this.makeRequestWithRetry(
      'GET',
      `/reservas/${reservaId}?usuarioId=${userId}`,
      { headers: await this.getAuthHeaders() }
    );

    const reserva = response.data;
    
    if (reserva) {
      await this.cache.set(cacheKey, reserva);
    }
    
    this.circuitBreaker.recordSuccess();
    return reserva || null;
  } catch (error) {
    this.circuitBreaker.recordFailure();
    return null;
  }
}
```

### **4. Actualizar Estado de Reserva**

```typescript
async updateReservaStatus(
  reservaId: number, 
  estado: 'confirmado' | 'pendiente' | 'cancelado',
  userId: number
): Promise<ReservaStock> {
  // Verificar circuit breaker
  if (this.circuitBreaker.isOpen()) {
    throw new Error('Stock service unavailable');
  }

  try {
    const response = await this.makeRequestWithRetry(
      'PATCH',
      `/reservas/${reservaId}`,
      {
        usuarioId: userId,
        estado: estado
      },
      { headers: await this.getAuthHeaders() }
    );

    const reserva = response.data;
    
    // Invalidar caché usando idCompra (si lo tenemos)
    if (reserva.idCompra) {
      await this.cache.delete(`stock:reserva:${reserva.idCompra}:${userId}`);
    }
    
    this.circuitBreaker.recordSuccess();
    return reserva;
  } catch (error) {
    this.circuitBreaker.recordFailure();
    throw error;
  }
}
```

### **5. Método Helper: Obtener y Actualizar Reserva**

```typescript
async getAndUpdateReservaStatus(
  compraId: string,
  userId: number,
  nuevoEstado: 'confirmado' | 'pendiente' | 'cancelado'
): Promise<ReservaStock | null> {
  try {
    // 1. Buscar reserva por idCompra
    const reserva = await this.getReservaByCompraId(compraId, userId);
    
    if (!reserva) {
      this.logger.warn(`Reserva no encontrada para compraId: ${compraId}, userId: ${userId}`);
      return null;
    }

    // 2. Actualizar estado usando idReserva
    const reservaActualizada = await this.updateReservaStatus(
      reserva.idReserva,
      nuevoEstado,
      userId
    );

    this.logger.log(`Reserva ${reserva.idReserva} actualizada a estado: ${nuevoEstado}`);
    return reservaActualizada;
  } catch (error) {
    this.logger.error(`Error al actualizar reserva para compraId: ${compraId}`, error);
    throw error;
  }
}
```

## 🔄 **Manejo de Errores y Reintentos**

### **Estrategia de Reintentos:**

```typescript
private async makeRequestWithRetry(
  method: string,
  url: string,
  data?: any,
  config?: any
): Promise<AxiosResponse> {
  const maxRetries = this.configService.get('STOCK_API_RETRY_ATTEMPTS', 3);
  const baseDelay = this.configService.get('STOCK_API_RETRY_DELAY', 1000);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await this.httpClient.axiosRef.request({
        method,
        url: `${this.baseUrl}${url}`,
        data,
        ...config,
      });
      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      await this.sleep(delay);
    }
  }
}
```

### **Circuit Breaker:**

```typescript
@Injectable()
export class StockCircuitBreakerService {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 30000; // 30 segundos

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

## 🧪 **Testing**

### **Tests Unitarios:**

```typescript
describe('StockIntegrationService', () => {
  let service: StockIntegrationService;
  let httpService: HttpService;
  let circuitBreaker: StockCircuitBreakerService;
  let cache: StockCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockIntegrationService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              request: jest.fn(),
            },
          },
        },
        {
          provide: StockCircuitBreakerService,
          useValue: {
            isOpen: jest.fn(),
            recordSuccess: jest.fn(),
            recordFailure: jest.fn(),
          },
        },
        {
          provide: StockCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StockIntegrationService>(StockIntegrationService);
    httpService = module.get<HttpService>(HttpService);
    circuitBreaker = module.get<StockCircuitBreakerService>(StockCircuitBreakerService);
    cache = module.get<StockCacheService>(StockCacheService);
  });

  describe('getProductById', () => {
    it('should return product from cache if available', async () => {
      const mockProduct = { id: 1, nombre: 'Test Product' };
      jest.spyOn(cache, 'get').mockResolvedValue(mockProduct);

      const result = await service.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(cache.get).toHaveBeenCalledWith('stock:product:1');
    });

    it('should return default product when circuit breaker is open', async () => {
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(true);

      const result = await service.getProductById(1);

      expect(result).toEqual({
        id: 1,
        nombre: 'Producto No Disponible',
        pesoKg: 1.0,
        dimensiones: { largoCm: 10, anchoCm: 10, altoCm: 10 },
        ubicacion: { postal_code: 'H3500ABC' }
      });
    });

    it('should find reserva by compraId from user reservas list', async () => {
      const mockReservas = [
        { idReserva: 1, idCompra: 'COMPRA-123', estado: 'pendiente' },
        { idReserva: 2, idCompra: 'COMPRA-456', estado: 'confirmado' }
      ];
      
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(false);
      jest.spyOn(httpService.axiosRef, 'request').mockResolvedValue({ data: mockReservas });
      jest.spyOn(cache, 'set').mockResolvedValue(undefined);
      jest.spyOn(circuitBreaker, 'recordSuccess').mockImplementation();

      const result = await service.getReservaByCompraId('COMPRA-456', 123);

      expect(result).toEqual({ idReserva: 2, idCompra: 'COMPRA-456', estado: 'confirmado' });
      expect(httpService.axiosRef.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('/reservas?usuarioId=123')
        })
      );
    });

    it('should make HTTP request and cache result on success', async () => {
      const mockProduct = { id: 1, nombre: 'Test Product' };
      const mockResponse = { data: mockProduct };
      
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(circuitBreaker, 'isOpen').mockReturnValue(false);
      jest.spyOn(httpService.axiosRef, 'request').mockResolvedValue(mockResponse);
      jest.spyOn(cache, 'set').mockResolvedValue(undefined);
      jest.spyOn(circuitBreaker, 'recordSuccess').mockImplementation();

      const result = await service.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(cache.set).toHaveBeenCalledWith('stock:product:1', mockProduct);
      expect(circuitBreaker.recordSuccess).toHaveBeenCalled();
    });
  });
});
```

### **Tests de Integración:**

```typescript
describe('StockIntegrationService Integration', () => {
  let app: INestApplication;
  let service: StockIntegrationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        StockIntegrationModule,
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    service = moduleFixture.get<StockIntegrationService>(StockIntegrationService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Real Stock API Integration', () => {
    it('should fetch real product data from Stock API', async () => {
      // Este test se ejecutará cuando tengamos la instancia de testing
      const product = await service.getProductById(1);
      
      expect(product).toBeDefined();
      expect(product.id).toBe(1);
      expect(product.pesoKg).toBeGreaterThan(0);
      expect(product.dimensiones).toBeDefined();
      expect(product.ubicacion.postal_code).toMatch(/^[A-Z]\d{4}[A-Z]{3}$/);
    });

    it('should handle authentication errors gracefully', async () => {
      // Test para manejo de errores de autenticación
      await expect(service.getProductById(999)).rejects.toThrow();
    });
  });
});
```

## 📈 **Métricas y Monitoreo**

### **Métricas a Implementar:**

1. **Latencia de requests** a Stock API
2. **Tasa de éxito/fallo** de requests
3. **Estado del circuit breaker** (CLOSED/OPEN/HALF_OPEN)
4. **Hit rate del caché** Redis
5. **Tiempo de respuesta** promedio por endpoint

### **Logs Estructurados:**

```typescript
// Ejemplo de logging
this.logger.log({
  message: 'Stock API request',
  endpoint: '/productos/123',
  method: 'GET',
  duration: 150,
  status: 'success',
  circuitBreakerState: 'CLOSED',
  cacheHit: false,
}, 'StockIntegrationService');
```

## 🔒 **Seguridad**

### **Autenticación JWT:**

```typescript
private async getAuthHeaders(): Promise<Record<string, string>> {
  const token = await this.getValidToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

private async getValidToken(): Promise<string> {
  // Implementar obtención de token JWT desde Keycloak
  // Con refresh automático cuando expire
}
```

### **Scopes Requeridos:**

- `productos:read` - Para consultar productos
- `reservas:read` - Para consultar reservas
- `reservas:write` - Para actualizar estados de reserva

## 🎯 **Impacto en el Sistema**

### **Integración con RF-001:**
- **Transport Methods**: Usar datos de productos para cálculo de costos
- **Coverage Zones**: Validar ubicaciones de depósitos
- **Tariff Config**: Aplicar tarifas basadas en peso y volumen

### **Integración con Shipping:**
- **Cálculo de costos**: Usar peso y dimensiones de productos
- **Validación de reservas**: Verificar stock antes de crear envío
- **Gestión de estados**: Actualizar reservas cuando se procesa envío

## 📋 **Criterios de Éxito**

1. ✅ **100% de cobertura de tests** unitarios
2. ✅ **Tests de integración** funcionando con Stock API real
3. ✅ **Circuit breaker** funcionando correctamente
4. ✅ **Caché Redis** con hit rate > 80%
5. ✅ **Latencia promedio** < 500ms (incluyendo caché)
6. ✅ **Manejo de errores** robusto con fallbacks
7. ✅ **Documentación** completa de la API
8. ✅ **Logs estructurados** para monitoreo

## 🚀 **Próximos Pasos**

1. **Implementar** el módulo de integración con Stock
2. **Configurar** variables de entorno y autenticación
3. **Desarrollar** tests unitarios y de integración
4. **Integrar** con servicios de shipping existentes
5. **Monitorear** performance y ajustar configuraciones
6. **Documentar** casos de uso y troubleshooting

---

**Nota**: Este spec está basado en los OpenAPI proporcionados y se actualizará cuando tengamos acceso a la instancia de testing de Stock API.
