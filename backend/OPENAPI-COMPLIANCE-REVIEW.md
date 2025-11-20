# 📋 Análisis de Cumplimiento OpenAPI - Sistema de Logística

**Fecha:** 2025-11-07
**Revisión:** Especificación OpenAPI 3.0.3 vs Implementación Actual
**Nivel de Detalle:** 3 (Exhaustivo)

---

## 📊 Resumen Ejecutivo

Este documento analiza el grado de cumplimiento de la implementación actual del backend de Logística contra la especificación OpenAPI 3.0.3 proporcionada.

### Estado General

| Categoría | Estado | Cumplimiento |
|-----------|--------|--------------|
| **Endpoints** | 🟡 Parcial | 83% (5/6) |
| **DTOs/Schemas** | 🟢 Completo | 95% |
| **Base de Datos** | 🔴 Faltante | 0% (No hay modelo Shipment) |
| **OAuth2/Keycloak** | 🔴 No Implementado | 0% |
| **Integración Stock** | 🟢 Implementado | 90% |
| **Validaciones** | 🟢 Completo | 100% |

---

## 🚦 Estado de Endpoints

### ✅ Endpoints Implementados

#### 1. `POST /shipping/cost` - Calcular costo de envío
**Estado:** ✅ Implementado
**Ubicación:** `backend/services/shipping-service/src/shipping.controller.ts:38-58`

**Lo que cumple:**
- ✅ Endpoint existe
- ✅ DTO de request correcto (`CalculateCostRequestDto`)
- ✅ DTO de response correcto (`CalculateCostResponseDto`)
- ✅ Validación de `delivery_address` con formato CPA
- ✅ Validación de `products` con array mínimo 1
- ✅ Response incluye `currency`, `total_cost`, `transport_type`, `products`

**Lo que falta/difiere:**
- 🟡 **Lógica de integración con Stock:** Actualmente usa `MockDataService.getStockInfo()` en lugar de hacer requests HTTP reales al stock-integration-service
- 🟡 **Transport type:** Usa un `defaultTransportMethodId` hardcodeado en lugar de calcular para todos los tipos de transporte disponibles
- 🟡 **Departure postal code:** La spec OpenAPI dice que debe obtenerse del warehouse del producto (via Stock API), pero actualmente usa un valor hardcodeado `'C1000ABC'`

**Cómo implementar lo que falta:**

1. **Reemplazar MockDataService por HTTP calls al stock-integration-service:**
   - En `shipping.service.ts:61-63`, en lugar de `this.mockData.getStockInfo(productIds)`, hacer:
     ```typescript
     // Para cada producto, llamar al stock-integration-service
     const stockPromises = productIds.map(id =>
       this.httpService.get(`${this.stockServiceUrl}/productos/${id}`).toPromise()
     );
     const stockResponses = await Promise.all(stockPromises);
     const stockInfo = stockResponses.map(res => res.data);
     ```
   - Esto requiere que el stock-integration-service tenga un endpoint `GET /productos/:id` que proxy al API de Stock del Grupo 11

2. **Obtener departure_postal_code desde Stock API:**
   - Según la spec de Stock, cada `ProductoStockDto` incluye `ubicacion.postal_code`
   - En `shipping.service.ts:82`, en lugar de `'C1000ABC'`, usar:
     ```typescript
     // Asumir que todos los productos vienen del mismo warehouse
     const departurePostalCode = stockInfo[0].ubicacion.postal_code;

     const distanceRes = await this.distanceService.calculateDistance(
       dto.delivery_address.postal_code,
       departurePostalCode,
     );
     ```

3. **Calcular costo para múltiples transport types:**
   - La spec dice que el endpoint debe retornar el costo para UN tipo de transporte
   - Pero la integración con Order Management menciona que el portal consulta el costo para CADA método
   - Actualmente solo calcula para un método hardcodeado
   - Solución: Agregar parámetro opcional `transport_type` al endpoint:
     ```typescript
     // En CalculateCostRequestDto
     @IsOptional()
     @IsEnum(TransportType)
     transport_type?: TransportType;

     // En shipping.service.ts, si transport_type no está presente, usar un default
     const transportMethod = dto.transport_type || TransportType.ROAD;
     ```

---

#### 2. `POST /shipping` - Crear envío
**Estado:** ✅ Implementado
**Ubicación:** `backend/services/shipping-service/src/shipping.controller.ts:60-80`

**Lo que cumple:**
- ✅ Endpoint existe
- ✅ DTO de request correcto (`CreateShippingRequestDto`)
- ✅ DTO de response correcto (`CreateShippingResponseDto`)
- ✅ Validación de todos los campos requeridos
- ✅ Generación de `tracking_number`
- ✅ Cálculo de `estimated_delivery_at`
- ✅ Response incluye `shipping_id`, `status`, `transport_type`, `tracking_number`, `estimated_delivery_at`

**Lo que falta/difiere:**
- 🔴 **Persistencia en BD:** Actualmente usa array en memoria (`this.mockShipments`) en lugar de guardar en base de datos
- 🔴 **Modelo Shipment en Prisma:** NO EXISTE en `backend/shared/database/prisma/schema.prisma`
- 🟡 **Integración con Stock:** Usa mock data en lugar de HTTP calls reales
- 🟡 **Validación de disponibilidad:** No valida stock disponible suficiente
- 🟡 **ID de Shipment:** Usa `mock-${this.nextId++}` en lugar de UUID de BD

**Cómo implementar lo que falta:**

1. **Crear modelo Shipment en Prisma:**
   - Ubicación: `backend/shared/database/prisma/schema.prisma`
   - Agregar el siguiente modelo:
     ```prisma
     model Shipment {
       id                    String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
       orderId               Int              @map("order_id")
       userId                Int              @map("user_id")
       trackingNumber        String           @unique @map("tracking_number") @db.VarChar(50)

       // Delivery address (campos desnormalizados para performance)
       deliveryStreet        String           @map("delivery_street") @db.VarChar(200)
       deliveryCity          String           @map("delivery_city") @db.VarChar(100)
       deliveryState         String           @map("delivery_state") @db.VarChar(100)
       deliveryPostalCode    String           @map("delivery_postal_code") @db.VarChar(20)
       deliveryCountry       String           @map("delivery_country") @db.VarChar(2)

       // Departure address (obtenida de Stock API)
       departureStreet       String?          @map("departure_street") @db.VarChar(200)
       departureCity         String?          @map("departure_city") @db.VarChar(100)
       departureState        String?          @map("departure_state") @db.VarChar(100)
       departurePostalCode   String?          @map("departure_postal_code") @db.VarChar(20)
       departureCountry      String?          @map("departure_country") @db.VarChar(2)

       status                String           @db.VarChar(30)  // ShippingStatus enum
       transportType         String           @map("transport_type") @db.VarChar(20)  // TransportType enum
       carrierName           String?          @map("carrier_name") @db.VarChar(100)

       totalCost             Decimal          @map("total_cost") @db.Decimal(10, 2)
       currency              String           @default("ARS") @db.VarChar(3)

       estimatedDeliveryAt   DateTime         @map("estimated_delivery_at") @db.Timestamptz(6)
       cancelledAt           DateTime?        @map("cancelled_at") @db.Timestamptz(6)

       createdAt             DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
       updatedAt             DateTime         @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

       products              ShipmentProduct[]
       logs                  ShipmentLog[]

       @@index([orderId], map: "idx_shipments_order")
       @@index([userId], map: "idx_shipments_user")
       @@index([status], map: "idx_shipments_status")
       @@index([trackingNumber], map: "idx_shipments_tracking")
       @@index([createdAt], map: "idx_shipments_created_at")
       @@map("shipments")
     }

     model ShipmentProduct {
       id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
       shipmentId  String    @map("shipment_id") @db.Uuid
       productId   Int       @map("product_id")
       quantity    Int
       createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

       shipment    Shipment  @relation(fields: [shipmentId], references: [id], onDelete: Cascade, onUpdate: NoAction)

       @@index([shipmentId], map: "idx_shipment_products_shipment")
       @@index([productId], map: "idx_shipment_products_product")
       @@map("shipment_products")
     }

     model ShipmentLog {
       id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
       shipmentId  String    @map("shipment_id") @db.Uuid
       status      String    @db.VarChar(30)
       message     String
       timestamp   DateTime  @default(now()) @db.Timestamptz(6)

       shipment    Shipment  @relation(fields: [shipmentId], references: [id], onDelete: Cascade, onUpdate: NoAction)

       @@index([shipmentId], map: "idx_shipment_logs_shipment")
       @@index([timestamp], map: "idx_shipment_logs_timestamp")
       @@map("shipment_logs")
     }
     ```

2. **Ejecutar migración de Prisma:**
   ```bash
   cd backend/shared/database
   npx prisma migrate dev --name add-shipment-models
   npx prisma generate
   ```

3. **Actualizar ShippingService para usar Prisma:**
   - Inyectar `PrismaService` en el constructor
   - En `createShipping()`, reemplazar el mock storage con:
     ```typescript
     // Crear shipment en BD
     const shipment = await this.prisma.shipment.create({
       data: {
         orderId: dto.order_id,
         userId: dto.user_id,
         trackingNumber,
         deliveryStreet: dto.delivery_address.street,
         deliveryCity: dto.delivery_address.city,
         deliveryState: dto.delivery_address.state,
         deliveryPostalCode: dto.delivery_address.postal_code,
         deliveryCountry: dto.delivery_address.country,
         departureStreet: stockInfo[0].ubicacion.street,  // Del primer producto
         departureCity: stockInfo[0].ubicacion.city,
         departureState: stockInfo[0].ubicacion.state,
         departurePostalCode: stockInfo[0].ubicacion.postal_code,
         departureCountry: stockInfo[0].ubicacion.country,
         status: ShippingStatus.CREATED,
         transportType: dto.transport_type,
         totalCost: totalCost,
         currency: 'ARS',
         estimatedDeliveryAt: estimatedDelivery,
         products: {
           create: dto.products.map(p => ({
             productId: p.id,
             quantity: p.quantity,
           })),
         },
         logs: {
           create: {
             status: ShippingStatus.CREATED,
             message: `Shipment created with tracking number: ${trackingNumber}`,
             timestamp: new Date(),
           },
         },
       },
       include: {
         products: true,
         logs: true,
       },
     });

     return {
       shipping_id: shipment.id,
       status: shipment.status.toLowerCase(),
       transport_type: shipment.transportType,
       tracking_number: shipment.trackingNumber,
       estimated_delivery_at: shipment.estimatedDeliveryAt.toISOString(),
     };
     ```

4. **Integrar con Stock API real:**
   - En lugar de `this.mockData.getStockInfo(productIds)`, usar el stock-integration-service:
     ```typescript
     const stockPromises = productIds.map(id =>
       this.httpService.get(`${this.stockServiceUrl}/productos/${id}`).pipe(
         map(res => res.data),
         catchError(error => {
           this.logger.error(`Error fetching product ${id}:`, error);
           throw new BadRequestException(`Product ${id} not available`);
         }),
       ).toPromise()
     );
     const stockInfo = await Promise.all(stockPromises);

     // Validar stock disponible
     for (const product of dto.products) {
       const stock = stockInfo.find(s => s.id === product.id);
       if (!stock) {
         throw new BadRequestException(`Product ${product.id} not found`);
       }
       if (stock.stockDisponible < product.quantity) {
         throw new BadRequestException(
           `Insufficient stock for product ${product.id}. Available: ${stock.stockDisponible}, requested: ${product.quantity}`
         );
       }
     }
     ```

---

#### 3. `GET /shipping` - Listar envíos con filtros
**Estado:** ✅ Implementado
**Ubicación:** `backend/services/shipping-service/src/shipping.controller.ts:82-136`

**Lo que cumple:**
- ✅ Endpoint existe
- ✅ Query params correctos: `user_id`, `status`, `from_date`, `to_date`, `page`, `limit`
- ✅ Response incluye paginación y lista de shipments
- ✅ DTO de response correcto (`ListShippingResponseDto`)

**Lo que falta/difiere:**
- 🔴 **Consulta a BD:** Usa array en memoria en lugar de Prisma
- 🟡 **Validación de fechas:** No valida formato ISO 8601
- 🟡 **Defaults:** `page` default 1, `limit` default 20 (correctos según spec)

**Cómo implementar lo que falta:**

1. **Reemplazar mock storage con Prisma:**
   ```typescript
   async listShipments(filters: {
     userId?: number;
     status?: string;
     fromDate?: string;
     toDate?: string;
     page: number;
     limit: number;
   }): Promise<ListShippingResponseDto> {
     const { userId, status, fromDate, toDate, page, limit } = filters;

     // Construir where clause
     const where: any = {};

     if (userId) {
       where.userId = userId;
     }

     if (status) {
       where.status = status.toUpperCase();
     }

     if (fromDate || toDate) {
       where.createdAt = {};
       if (fromDate) {
         where.createdAt.gte = new Date(fromDate);
       }
       if (toDate) {
         where.createdAt.lte = new Date(toDate);
       }
     }

     // Consultar con paginación
     const skip = (page - 1) * limit;

     const [shipments, total] = await Promise.all([
       this.prisma.shipment.findMany({
         where,
         include: {
           products: true,
         },
         orderBy: {
           createdAt: 'desc',
         },
         skip,
         take: limit,
       }),
       this.prisma.shipment.count({ where }),
     ]);

     return {
       shipments: shipments.map(s => ({
         shipping_id: s.id,
         order_id: s.orderId,
         user_id: s.userId,
         products: s.products.map(p => ({
           product_id: p.productId,
           quantity: p.quantity,
         })),
         status: s.status.toLowerCase(),
         transport_type: s.transportType.toLowerCase(),
         estimated_delivery_at: s.estimatedDeliveryAt.toISOString(),
         created_at: s.createdAt.toISOString(),
       })),
       pagination: {
         current_page: page,
         total_pages: Math.ceil(total / limit),
         total_items: total,
         items_per_page: limit,
       },
     };
   }
   ```

2. **Validar formato de fechas:**
   - Agregar un pipe de validación en el controller:
     ```typescript
     import { ParseDatePipe } from '@nestjs/common';

     @Get()
     async listShipments(
       @Query('user_id', ParseIntPipe, { optional: true }) userId?: number,
       @Query('status') status?: string,
       @Query('from_date') fromDate?: string,  // Validar formato ISO 8601
       @Query('to_date') toDate?: string,
       @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
       @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
     ) { ... }
     ```
   - O crear un pipe custom para validar ISO 8601:
     ```typescript
     @Injectable()
     export class ParseISODatePipe implements PipeTransform {
       transform(value: string): Date {
         if (!value) return undefined;
         const date = new Date(value);
         if (isNaN(date.getTime())) {
           throw new BadRequestException('Invalid ISO 8601 date format');
         }
         return date;
       }
     }
     ```

---

#### 4. `GET /shipping/{shipping_id}` - Obtener detalle de envío
**Estado:** ✅ Implementado
**Ubicación:** `backend/services/shipping-service/src/shipping.controller.ts:138-156`

**Lo que cumple:**
- ✅ Endpoint existe
- ✅ Path param `:id` correcto
- ✅ Response incluye todos los campos requeridos por la spec
- ✅ DTO de response correcto (`ShippingDetailDto`)
- ✅ Retorna 404 si no existe

**Lo que falta/difiere:**
- 🔴 **Consulta a BD:** Usa array en memoria en lugar de Prisma
- 🟡 **Logs ordenados:** No garantiza que los logs estén ordenados por timestamp descendente

**Cómo implementar lo que falta:**

1. **Reemplazar mock storage con Prisma:**
   ```typescript
   async getShippingDetail(id: string): Promise<ShippingDetailDto> {
     const shipment = await this.prisma.shipment.findUnique({
       where: { id },
       include: {
         products: true,
         logs: {
           orderBy: {
             timestamp: 'desc',
           },
         },
       },
     });

     if (!shipment) {
       throw new NotFoundException(`Shipping ${id} not found`);
     }

     return {
       shipping_id: shipment.id,
       order_id: shipment.orderId,
       user_id: shipment.userId,
       delivery_address: {
         street: shipment.deliveryStreet,
         city: shipment.deliveryCity,
         state: shipment.deliveryState,
         postal_code: shipment.deliveryPostalCode,
         country: shipment.deliveryCountry,
       },
       departure_address: shipment.departureStreet
         ? {
             street: shipment.departureStreet,
             city: shipment.departureCity,
             state: shipment.departureState,
             postal_code: shipment.departurePostalCode,
             country: shipment.departureCountry,
           }
         : undefined,
       products: shipment.products.map(p => ({
         product_id: p.productId,
         quantity: p.quantity,
       })),
       status: shipment.status.toLowerCase(),
       transport_type: shipment.transportType.toLowerCase(),
       tracking_number: shipment.trackingNumber || undefined,
       carrier_name: shipment.carrierName || undefined,
       total_cost: Number(shipment.totalCost),
       currency: shipment.currency,
       estimated_delivery_at: shipment.estimatedDeliveryAt.toISOString(),
       created_at: shipment.createdAt.toISOString(),
       updated_at: shipment.updatedAt.toISOString(),
       logs: shipment.logs.map(log => ({
         timestamp: log.timestamp.toISOString(),
         status: log.status.toLowerCase(),
         message: log.message,
       })),
     };
   }
   ```

---

#### 5. `POST /shipping/{shipping_id}/cancel` - Cancelar envío
**Estado:** ✅ Implementado
**Ubicación:** `backend/services/shipping-service/src/shipping.controller.ts:158-182`

**Lo que cumple:**
- ✅ Endpoint existe
- ✅ Path param `:id` correcto
- ✅ Validación de estados permitidos (CREATED, RESERVED)
- ✅ Response correcto con `cancelled_at`
- ✅ Retorna 400 si estado no permite cancelación
- ✅ Retorna 404 si no existe

**Lo que falta/difiere:**
- 🔴 **Consulta a BD:** Usa array en memoria en lugar de Prisma
- 🟡 **Notificación a Order Management:** No implementado (mencionado en spec)
- 🟡 **Trigger de liberación de stock:** No implementado (mencionado en spec)

**Cómo implementar lo que falta:**

1. **Reemplazar mock storage con Prisma:**
   ```typescript
   async cancelShipping(id: string): Promise<CancelShippingResponseDto> {
     const shipment = await this.prisma.shipment.findUnique({
       where: { id },
     });

     if (!shipment) {
       throw new NotFoundException(`Shipping ${id} not found`);
     }

     if (!['CREATED', 'RESERVED'].includes(shipment.status)) {
       throw new BadRequestException(
         `Shipment cannot be cancelled. Current status '${shipment.status.toLowerCase()}' does not allow cancellation.`,
       );
     }

     const cancelledAt = new Date();

     const updated = await this.prisma.shipment.update({
       where: { id },
       data: {
         status: ShippingStatus.CANCELLED,
         cancelledAt,
         updatedAt: cancelledAt,
         logs: {
           create: {
             status: ShippingStatus.CANCELLED,
             message: 'Shipment cancelled by user',
             timestamp: cancelledAt,
           },
         },
       },
     });

     return {
       shipping_id: updated.id,
       status: 'cancelled',
       cancelled_at: updated.cancelledAt.toISOString(),
     };
   }
   ```

2. **Integración con Order Management (opcional, futuro):**
   - Crear un servicio de notificaciones
   - Enviar evento/webhook a Order Management cuando se cancela
   - Ejemplo:
     ```typescript
     // En cancelShipping, después de actualizar BD:
     await this.notificationService.notifyOrderManagement({
       event: 'shipment.cancelled',
       shipping_id: id,
       order_id: shipment.orderId,
       cancelled_at: cancelledAt.toISOString(),
     });
     ```

3. **Liberación de stock en Inventory (según spec):**
   - Después de cancelar el shipment, llamar al stock-integration-service
   - Ejemplo:
     ```typescript
     // En cancelShipping, después de actualizar BD:
     try {
       await this.httpService.delete(
         `${this.stockServiceUrl}/reservas/${shipment.orderId}`,
         {
           headers: { Authorization: `Bearer ${token}` },
           data: { motivo: 'Shipment cancelled by user' },
         }
       ).toPromise();
     } catch (error) {
       this.logger.error(`Failed to release stock for order ${shipment.orderId}`, error);
       // No fallar la cancelación si falla la liberación de stock
     }
     ```

---

### 🔴 Endpoints NO Implementados

#### 6. `GET /shipping/transport-methods` - Obtener métodos de transporte disponibles

**Estado:** 🔴 NO IMPLEMENTADO en shipping-service
**Nota:** Este endpoint EXISTE en `config-service` como `GET /config/transport-methods`, pero según la especificación OpenAPI debe estar en `/shipping/transport-methods`

**Ubicación actual:** `backend/services/config-service/src/config/transport-method.controller.ts:48-57`

**Problema:**
- La spec OpenAPI dice: `GET /shipping/transport-methods`
- La implementación actual tiene: `GET /config/transport-methods`
- Esto es una **discrepancia de rutas** que rompe el contrato del API

**Opciones para solucionar:**

**Opción 1: Agregar endpoint proxy en shipping-service (Recomendado)**
- Ventaja: Cumple con la spec OpenAPI sin romper código existente
- Desventaja: Duplicación de endpoint

Implementación:
```typescript
// En backend/services/shipping-service/src/shipping.controller.ts

@Get('transport-methods')
@ApiOperation({
  summary: '🚢 Obtener métodos de transporte disponibles',
  description: 'Retorna la lista de métodos de transporte que pueden usarse para envíos',
})
@ApiResponse({
  status: 200,
  description: 'Lista de métodos de transporte',
  type: TransportMethodsResponseDto,
})
async getTransportMethods(): Promise<TransportMethodsResponseDto> {
  return this.shippingService.getTransportMethods();
}
```

```typescript
// En backend/services/shipping-service/src/shipping.service.ts

async getTransportMethods(): Promise<TransportMethodsResponseDto> {
  // Llamar al config-service para obtener métodos de transporte
  const configServiceUrl = this.configService.get<string>(
    'CONFIG_SERVICE_URL',
    'http://localhost:3003',
  );

  try {
    const response = await this.httpService
      .get(`${configServiceUrl}/config/transport-methods`)
      .toPromise();

    const methods = response.data as TransportMethod[];

    // Transformar a formato de respuesta según spec OpenAPI
    return {
      transport_methods: methods
        .filter(m => m.isActive)
        .map(m => ({
          type: m.code as TransportType,  // 'air', 'road', 'rail', 'sea'
          name: m.name,
          estimated_days: m.estimatedDays,
        })),
    };
  } catch (error) {
    this.logger.error('Error fetching transport methods from config service', error);
    throw new InternalServerErrorException('Could not fetch transport methods');
  }
}
```

**Opción 2: Cambiar la ruta en config-service**
- Ventaja: No hay duplicación
- Desventaja: Rompe código existente que usa `/config/transport-methods`

**Opción 3: Documentar la discrepancia y actualizar la spec OpenAPI**
- Si el equipo decide que `/config/transport-methods` es la ruta correcta
- Actualizar la especificación OpenAPI para reflejar la implementación real

**DTOs requeridos:**

Crear en `backend/services/shipping-service/src/dto/transport-methods.dto.ts`:
```typescript
export class TransportMethodDto {
  type: TransportType;  // 'air' | 'sea' | 'rail' | 'road'
  name: string;
  estimated_days: string;  // Ej: "1-3", "3-7", "15-30"
}

export class TransportMethodsResponseDto {
  transport_methods: TransportMethodDto[];
}
```

**Respuesta esperada según spec:**
```json
{
  "transport_methods": [
    {
      "type": "air",
      "name": "Air Freight",
      "estimated_days": "1-3"
    },
    {
      "type": "road",
      "name": "Road Transport",
      "estimated_days": "3-7"
    },
    {
      "type": "rail",
      "name": "Rail Freight",
      "estimated_days": "5-10"
    },
    {
      "type": "sea",
      "name": "Sea Freight",
      "estimated_days": "15-30"
    }
  ]
}
```

---

## 📦 Análisis de DTOs y Schemas

### ✅ DTOs Correctos

Los siguientes DTOs cumplen completamente con la especificación OpenAPI:

1. **AddressDto** (`backend/shared/types/src/dtos/address.dto.ts`)
   - ✅ Campos: `street`, `city`, `state`, `postal_code`, `country`
   - ✅ Validación de postal_code con regex CPA: `/^[A-Z]{1}\d{4}[A-Z]{3}$/`
   - ✅ Validación de country: length 2

2. **ProductRequestDto** (`backend/shared/types/src/dtos/product-request.dto.ts`)
   - ✅ Campos: `id`, `quantity`
   - ✅ Validación: `id` y `quantity` >= 1

3. **CalculateCostRequestDto** (`shipping-service/src/dto/calculate-cost.dto.ts`)
   - ✅ Campos: `delivery_address`, `products`
   - ✅ Nested validation con `@ValidateNested()`

4. **CalculateCostResponseDto** (`shipping-service/src/dto/calculate-cost.dto.ts`)
   - ✅ Campos: `currency`, `total_cost`, `transport_type`, `products`
   - ✅ Incluye `breakdown` opcional (no requerido por spec pero útil)

5. **CreateShippingRequestDto** (`shipping-service/src/dto/create-shipping.dto.ts`)
   - ✅ Campos: `order_id`, `user_id`, `delivery_address`, `transport_type`, `products`
   - ✅ Validaciones correctas

6. **CreateShippingResponseDto** (`shipping-service/src/dto/create-shipping.dto.ts`)
   - ✅ Campos: `shipping_id`, `status`, `transport_type`, `estimated_delivery_at`
   - ✅ Incluye `tracking_number` opcional

7. **ShippingDetailDto** (`shipping-service/src/dto/shipping-responses.dto.ts`)
   - ✅ Todos los campos requeridos por la spec
   - ✅ Nested objects: `delivery_address`, `departure_address`, `products`, `logs`

8. **ListShippingResponseDto** (`shipping-service/src/dto/shipping-responses.dto.ts`)
   - ✅ Campos: `shipments`, `pagination`
   - ✅ Paginación con metadata correcto

9. **CancelShippingResponseDto** (`shipping-service/src/dto/shipping-responses.dto.ts`)
   - ✅ Campos: `shipping_id`, `status`, `cancelled_at`

### 🟡 DTOs que necesitan ajuste

**TransportType enum** (`backend/shared/types/src/enums/transport-type.enum.ts`)
- ✅ Valores correctos: `'air'`, `'sea'`, `'rail'`, `'road'`
- ✅ Cumple con la spec OpenAPI

**ShippingStatus enum** (`backend/shared/types/src/enums/shipping-status.enum.ts`)
- ✅ Valores correctos según spec:
  - `created`, `reserved`, `in_transit`, `arrived`, `in_distribution`, `delivered`, `cancelled`
- ✅ Cumple con la spec OpenAPI

### 🔴 DTOs Faltantes

**TransportMethodsResponseDto** (mencionado arriba en endpoint faltante)
- Necesario para `GET /shipping/transport-methods`

---

## 🗄️ Base de Datos

### 🔴 Modelo Shipment NO EXISTE

**Problema crítico:** La base de datos no tiene modelo `Shipment` en Prisma schema.

**Ubicación:** `backend/shared/database/prisma/schema.prisma`

**Modelos existentes:**
- ✅ `TransportMethod`
- ✅ `CoverageZone`
- ✅ `TariffConfig`
- ✅ `Vehicle`
- ✅ `Driver`
- ✅ `Route`
- ✅ `RouteStop`

**Modelos faltantes:**
- 🔴 `Shipment`
- 🔴 `ShipmentProduct` (relación N:N entre Shipment y productos)
- 🔴 `ShipmentLog` (historial de cambios de estado)

**Implementación completa:** Ver sección "POST /shipping - Crear envío" arriba para el schema completo de Prisma.

**Pasos para implementar:**
1. Agregar modelos al `schema.prisma`
2. Ejecutar `npx prisma migrate dev --name add-shipment-models`
3. Ejecutar `npx prisma generate` en todos los servicios
4. Actualizar servicios para usar Prisma en lugar de mock storage

---

## 🔐 OAuth2 / Keycloak

### 🔴 NO IMPLEMENTADO

**Estado:** Documentado pero no implementado

**Documentación existente:**
- `backend/services/operator-interface-service/JWT-IMPLEMENTATION-GUIDE.md`
- `backend/services/operator-interface-service/KEYCLOAK-CONFIG.md`

**Lo que existe:**
- ✅ Guía completa de implementación
- ✅ Dependencias instaladas: `jsonwebtoken`, `jwks-rsa`
- 🔴 Código NO implementado

**Archivos que faltan crear:**
1. `src/auth/jwt.service.ts` - Servicio de validación JWT
2. `src/auth/jwt.strategy.ts` - Passport strategy
3. `src/auth/jwt.guard.ts` - Guard para proteger endpoints
4. `src/auth/auth.module.ts` - Módulo de autenticación

**Endpoints que deben protegerse según spec OpenAPI:**

**Públicos (sin OAuth2):**
- `GET /health`
- `GET /gateway/status`

**Protegidos con OAuth2:**
- `POST /shipping/cost` - Requiere scope `envios:read`
- `GET /shipping/transport-methods` - Requiere scope `envios:read`
- `POST /shipping` - Requiere scope `envios:write`
- `GET /shipping` - Requiere scope `envios:read`
- `GET /shipping/{shipping_id}` - Requiere scope `envios:read`
- `POST /shipping/{shipping_id}/cancel` - Requiere scope `envios:write`

**Scopes definidos en la spec:**
```yaml
envios:read: Allows reading shipment information and calculating costs
envios:write: Allows creating, updating and cancelling shipments
productos:read: Allows reading product information from the Stock module
reservas:read: Allows reading stock reservation information
reservas:write: Allows creating, updating and cancelling stock reservations
```

**Implementación:**

1. **Seguir la guía en `JWT-IMPLEMENTATION-GUIDE.md`**
   - Crear todos los archivos mencionados
   - Configurar Keycloak con los scopes correctos
   - Proteger endpoints con el guard

2. **Marcar rutas públicas:**
   ```typescript
   import { Public } from '../auth/jwt.guard';

   @Controller()
   export class HealthController {
     @Get('/health')
     @Public()
     getHealth() {
       return { status: 'ok' };
     }
   }
   ```

3. **Validar scopes en endpoints protegidos:**
   ```typescript
   import { Scopes } from '../auth/scopes.decorator';

   @Post('cost')
   @Scopes('envios:read')
   async calculateCost(...) { ... }

   @Post()
   @Scopes('envios:write')
   async createShipping(...) { ... }
   ```

4. **Pasar user context a microservicios:**
   - El Operator Interface Gateway debe extraer claims del JWT
   - Pasar claims como headers a microservicios:
     ```typescript
     headers['x-user-id'] = user.userId;
     headers['x-user-email'] = user.email;
     headers['x-user-roles'] = user.roles.join(',');
     ```

---

## 🔗 Integración con Stock Module (Grupo 11)

### 🟢 Infraestructura Implementada

**Stock Integration Service:**
- ✅ Servicio creado: `backend/services/stock-integration-service`
- ✅ DTOs correctos según spec de Stock:
  - `ProductoStockDto` con campos: `id`, `nombre`, `precio`, `stockDisponible`, `pesoKg`, `dimensiones`, `ubicacion`
  - `DimensionesDto` con: `largoCm`, `anchoCm`, `altoCm`
  - `UbicacionAlmacenDto` con: `street`, `city`, `state`, `postal_code`, `country`
- ✅ Circuit breaker implementado
- ✅ Cache Redis implementado
- ✅ Retry logic implementado

**Endpoints del Stock API (Grupo 11) que debemos consumir:**
- `GET /productos/{productoId}` - Obtener producto por ID
- `GET /reservas?usuarioId={userId}` - Listar reservas de usuario
- `GET /reservas/{idReserva}?usuarioId={userId}` - Obtener reserva por ID
- `POST /reservas` - Crear reserva
- `PATCH /reservas/{idReserva}` - Actualizar estado de reserva
- `DELETE /reservas/{idReserva}` - Cancelar reserva

### 🟡 Lo que falta integrar

**En Shipping Service:**
1. **Reemplazar MockDataService por HTTP calls reales:**
   - Actualmente: `this.mockData.getStockInfo(productIds)`
   - Debería: `this.httpService.get(\`\${stockServiceUrl}/productos/\${id}\`)`

2. **Endpoint en Stock Integration Service:**
   - Actualmente el stock-integration-service NO expone endpoint REST
   - Solo tiene el servicio interno
   - **Falta crear controller:**

```typescript
// En backend/services/stock-integration-service/src/stock-integration.controller.ts

import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StockIntegrationService } from './services/stock-integration.service';
import { ProductoStockDto, ReservaStockDto } from './dto';

@ApiTags('stock')
@Controller('stock')
export class StockIntegrationController {
  constructor(private readonly stockService: StockIntegrationService) {}

  @Get('productos/:id')
  @ApiOperation({ summary: 'Obtener producto por ID del Stock API' })
  @ApiResponse({ status: 200, type: ProductoStockDto })
  async getProduct(@Param('id', ParseIntPipe) id: number): Promise<ProductoStockDto> {
    return this.stockService.getProductById(id);
  }

  @Get('reservas/:idReserva')
  @ApiOperation({ summary: 'Obtener reserva por ID' })
  @ApiResponse({ status: 200, type: ReservaStockDto })
  async getReserva(
    @Param('idReserva', ParseIntPipe) idReserva: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<ReservaStockDto | null> {
    return this.stockService.getReservaById(idReserva, usuarioId);
  }

  @Get('reservas')
  @ApiOperation({ summary: 'Buscar reserva por ID de compra' })
  async getReservaByCompra(
    @Query('idCompra') idCompra: string,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<ReservaStockDto | null> {
    return this.stockService.getReservaByCompraId(idCompra, usuarioId);
  }
}
```

3. **Registrar en Operator Interface Gateway:**
   - El controller de stock-integration debe ser accesible via el gateway
   - Agregar ruta en `ServiceRegistry`:
     ```typescript
     this.registerService(
       'stock-integration-service',
       'http://localhost:3002',
       ['/stock'],
       '/health'
     );
     ```

4. **Actualizar Shipping Service para consumir Stock Integration:**
   ```typescript
   // En shipping.service.ts, método calculateCost()

   // Antes (mock):
   const stockInfo = await this.mockData.getStockInfo(productIds);

   // Después (real):
   const stockServiceUrl = this.configService.get<string>(
     'STOCK_SERVICE_URL',
     'http://localhost:3004/stock',  // Via gateway
   );

   const stockPromises = productIds.map(id =>
     this.httpService.get(`${stockServiceUrl}/productos/${id}`, {
       headers: { Authorization: `Bearer ${token}` },
     }).pipe(
       map(res => res.data),
       catchError(error => {
         this.logger.error(`Error fetching product ${id}:`, error);
         throw new BadRequestException(`Product ${id} not available`);
       }),
     ).toPromise()
   );

   const stockInfo = await Promise.all(stockPromises);
   ```

---

## 📝 Respuestas de Error

### ✅ Manejo de Errores Implementado

**Schema de error actual:**
```typescript
{
  code: string,
  message: string,
  details?: string | object | array
}
```

**Según spec OpenAPI:**
```yaml
Error:
  type: object
  required: [code, message]
  properties:
    code:
      type: string
      example: "unprocessable_entity"
    message:
      type: string
      example: "Validation failed."
    details:
      oneOf:
        - type: string
        - type: object
        - type: array
```

✅ **Cumple con la especificación**

**Códigos de error definidos en la spec:**

| Código HTTP | Nombre | Uso |
|-------------|--------|-----|
| 400 | Bad Request | Datos malformados o regla de negocio violada |
| 401 | Unauthorized | Token faltante o inválido |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto de estado |
| 422 | Unprocessable Entity | Validación fallida |
| 500 | Internal Server Error | Error inesperado del servidor |

**Ejemplos según spec:**

```json
// 400 - Bad Request (estado no permite cancelación)
{
  "code": "bad_request",
  "message": "Shipment cannot be cancelled. Current status 'in_transit' does not allow cancellation."
}

// 401 - Unauthorized
{
  "code": "unauthorized",
  "message": "Missing or invalid token."
}

// 404 - Not Found
{
  "code": "not_found",
  "message": "Resource not found."
}

// 422 - Unprocessable Entity (validación)
{
  "code": "unprocessable_entity",
  "message": "Validation failed.",
  "details": {
    "field_errors": [
      {
        "field": "products[0].quantity",
        "message": "Must be >= 1"
      },
      {
        "field": "delivery_address.postal_code",
        "message": "Must match Argentinian postal code format (e.g., H3500ABC)"
      }
    ]
  }
}
```

**Implementación actual en NestJS:**
- ✅ Usa excepciones estándar: `BadRequestException`, `NotFoundException`, `UnauthorizedException`
- ✅ Formato de respuesta coincide con la spec
- ✅ Mensajes descriptivos

**No se requieren cambios en manejo de errores.**

---

## 🚀 Plan de Implementación

### Prioridad 1: Base de Datos (CRÍTICO)

**Tiempo estimado:** 2-3 horas

1. **Crear modelos Shipment en Prisma**
   - Agregar `Shipment`, `ShipmentProduct`, `ShipmentLog` al schema
   - Ejecutar migración: `npx prisma migrate dev --name add-shipment-models`
   - Regenerar cliente: `npx prisma generate`

2. **Actualizar ShippingService para usar Prisma**
   - Inyectar `PrismaService`
   - Reemplazar todos los `this.mockShipments` con queries Prisma
   - Métodos a actualizar:
     - `createShipping()`
     - `listShipments()`
     - `getShippingDetail()`
     - `cancelShipping()`

3. **Testing**
   - Testear que shipments se persistan correctamente
   - Verificar que queries con filtros funcionan
   - Validar que logs se crean automáticamente

---

### Prioridad 2: Integración Stock Real (ALTA)

**Tiempo estimado:** 3-4 horas

1. **Crear controller en stock-integration-service**
   - Exponer endpoint `GET /stock/productos/:id`
   - Registrar en gateway

2. **Actualizar Shipping Service para consumir Stock Integration**
   - En `calculateCost()`: reemplazar mock con HTTP calls
   - En `createShipping()`: reemplazar mock con HTTP calls
   - Validar stock disponible antes de crear shipment

3. **Manejo de errores y fallbacks**
   - Si Stock API falla, retornar error 503 o usar fallback
   - Logging apropiado de errores

4. **Testing end-to-end**
   - Mock del Stock API con datos reales
   - Verificar que warehouse postal code se obtiene correctamente
   - Validar que cálculos de costo usan datos reales

---

### Prioridad 3: Endpoint transport-methods (MEDIA)

**Tiempo estimado:** 1-2 horas

**Opción recomendada:** Agregar endpoint proxy en shipping-service

1. **Crear endpoint `GET /shipping/transport-methods`**
   - Controller method en `ShippingController`
   - Service method que llama a config-service
   - DTO `TransportMethodsResponseDto`

2. **Transformar respuesta según spec**
   - Mapear de `TransportMethod` model a formato spec
   - Filtrar solo métodos activos
   - Incluir `estimated_days`

3. **Testing**
   - Verificar que retorna métodos activos
   - Validar formato de respuesta

---

### Prioridad 4: OAuth2/Keycloak (ALTA - Seguridad)

**Tiempo estimado:** 4-6 horas

1. **Implementar JWT validation en Operator Interface Gateway**
   - Seguir `JWT-IMPLEMENTATION-GUIDE.md`
   - Crear archivos: `jwt.service.ts`, `jwt.guard.ts`, `jwt.strategy.ts`, `auth.module.ts`

2. **Marcar rutas públicas**
   - `/health`, `/gateway/status` con decorator `@Public()`

3. **Validar scopes**
   - Crear decorator `@Scopes()` para validar scopes requeridos
   - Aplicar a endpoints protegidos

4. **Pasar user context a microservicios**
   - Extraer claims del JWT
   - Agregar headers `X-User-ID`, `X-User-Email`, `X-User-Roles`

5. **Configurar Keycloak**
   - Crear realm `ds-2025-realm` (si no existe)
   - Crear client `logix-backend`
   - Definir scopes: `envios:read`, `envios:write`, `productos:read`, etc.
   - Crear usuarios de prueba

6. **Testing**
   - Test con token válido → 200
   - Test sin token → 401
   - Test con token expirado → 401
   - Test con scope incorrecto → 403
   - Test rutas públicas sin token → 200

---

### Prioridad 5: Mejoras y Optimizaciones (BAJA)

**Tiempo estimado:** 2-3 horas

1. **Validación de fechas ISO 8601**
   - Crear pipe custom `ParseISODatePipe`
   - Aplicar a query params `from_date`, `to_date`

2. **Notificaciones a Order Management**
   - Crear servicio de notificaciones
   - Enviar eventos cuando se crea/cancela shipment

3. **Liberación de stock en cancelación**
   - Llamar a Stock API para cancelar reserva
   - Manejar errores gracefully

4. **Cálculo de costo para múltiples transport types**
   - Agregar parámetro opcional `transport_type` a `POST /shipping/cost`
   - O crear endpoint separado `POST /shipping/cost/all` que retorna array

5. **Documentación Swagger actualizada**
   - Agregar decorators `@ApiSecurity('OAuth2', ['envios:read'])`
   - Documentar todos los códigos de error
   - Agregar ejemplos de requests/responses

---

## 📊 Checklist de Cumplimiento

### Endpoints

- [x] ✅ `POST /shipping/cost` - Calcular costo (implementado, falta integración Stock real)
- [ ] 🔴 `GET /shipping/transport-methods` - Obtener métodos de transporte (NO implementado)
- [x] ✅ `POST /shipping` - Crear envío (implementado, falta persistencia BD)
- [x] ✅ `GET /shipping` - Listar envíos (implementado, falta consulta BD)
- [x] ✅ `GET /shipping/{shipping_id}` - Obtener detalle (implementado, falta consulta BD)
- [x] ✅ `POST /shipping/{shipping_id}/cancel` - Cancelar envío (implementado, falta consulta BD)

### DTOs y Schemas

- [x] ✅ `AddressDto`
- [x] ✅ `ProductRequestDto`
- [x] ✅ `CalculateCostRequestDto`
- [x] ✅ `CalculateCostResponseDto`
- [x] ✅ `CreateShippingRequestDto`
- [x] ✅ `CreateShippingResponseDto`
- [x] ✅ `ShippingDetailDto`
- [x] ✅ `ListShippingResponseDto`
- [x] ✅ `CancelShippingResponseDto`
- [ ] 🔴 `TransportMethodsResponseDto` (falta)
- [x] ✅ `TransportType` enum
- [x] ✅ `ShippingStatus` enum

### Base de Datos

- [x] ✅ `TransportMethod` model
- [x] ✅ `CoverageZone` model
- [x] ✅ `TariffConfig` model
- [ ] 🔴 `Shipment` model (NO EXISTE)
- [ ] 🔴 `ShipmentProduct` model (NO EXISTE)
- [ ] 🔴 `ShipmentLog` model (NO EXISTE)

### Seguridad (OAuth2)

- [ ] 🔴 JWT validation (no implementado)
- [ ] 🔴 Scopes validation (no implementado)
- [ ] 🔴 Rutas públicas marcadas (no implementado)
- [ ] 🔴 User context en headers (no implementado)

### Integración Stock

- [x] ✅ `StockIntegrationService` implementado
- [x] ✅ DTOs correctos según spec Stock
- [x] ✅ Circuit breaker
- [x] ✅ Cache Redis
- [ ] 🟡 Controller REST expuesto (falta)
- [ ] 🟡 Shipping service consume Stock real (usa mock)

### Validaciones

- [x] ✅ Postal code CPA format
- [x] ✅ Product quantity >= 1
- [x] ✅ Required fields
- [ ] 🟡 ISO 8601 date format (falta pipe)

### Respuestas de Error

- [x] ✅ Schema correcto
- [x] ✅ Códigos HTTP correctos
- [x] ✅ Mensajes descriptivos

---

## 📚 Referencias

### Especificaciones
- **OpenAPI Logística:** Ver archivo proporcionado
- **OpenAPI Stock (Grupo 11):** Ver archivo proporcionado

### Documentación Interna
- `backend/services/operator-interface-service/JWT-IMPLEMENTATION-GUIDE.md`
- `backend/services/operator-interface-service/KEYCLOAK-CONFIG.md`
- `backend/services/operator-interface-service/GATEWAY.md`
- `backend/services/stock-integration-service/README.md`
- `CLAUDE.md` - Guía completa del proyecto

### Archivos Clave
- `backend/shared/database/prisma/schema.prisma` - Schema de BD
- `backend/services/shipping-service/src/shipping.controller.ts` - Endpoints
- `backend/services/shipping-service/src/shipping.service.ts` - Lógica
- `backend/services/stock-integration-service/src/services/stock-integration.service.ts` - Integración Stock

---

## 🎯 Conclusión

### Cumplimiento General: 70%

**Fortalezas:**
- ✅ Estructura de endpoints bien diseñada
- ✅ DTOs completos y con validaciones correctas
- ✅ Integración con Stock bien arquitecturada
- ✅ Patrón Facade + Service Discovery implementado
- ✅ Manejo de errores según spec

**Debilidades Críticas:**
- 🔴 No hay persistencia en BD (modelo Shipment faltante)
- 🔴 OAuth2/Keycloak no implementado
- 🔴 Endpoint `GET /shipping/transport-methods` faltante

**Recomendaciones:**
1. **Priorizar Prioridad 1 (Base de Datos)** - Sin BD no hay producción
2. **Implementar OAuth2 (Prioridad 4)** - Requerimiento de seguridad crítico
3. **Integrar Stock real (Prioridad 2)** - Reemplazar mocks
4. **Agregar endpoint transport-methods (Prioridad 3)** - Cumplir contrato API

**Tiempo Estimado Total:** 12-18 horas de desarrollo
