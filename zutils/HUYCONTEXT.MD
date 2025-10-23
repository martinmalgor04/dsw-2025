ALCANCE DEL SISTEMA - MÓDULO DE TRANSPORTE, LOGÍSTICA Y SEGUIMIENTO

1. DEFINICIÓN GENERAL
Sistema de gestión logística que opera en modelo punto a punto (A→B): retira mercadería en depósitos de Stock y entrega directamente al cliente final, sin sucursales intermedias ni centros de distribución propios.
Responsabilidad: Coordinar y ejecutar el traslado físico de productos desde el depósito hasta el cliente.
No responsabilidad: Venta, cobro, gestión de inventario, atención comercial.

2. LÍMITES DEL SISTEMA
2.1 LO QUE EL SISTEMA SÍ HACE ✅
Operaciones Core:
Cotizar costo y tiempo de envío antes de la compra
Crear y registrar envíos post-compra
Planificar retiros en depósitos de Stock
Coordinar y ejecutar retiros físicos con documentación
Planificar rutas de entrega optimizadas (última milla)
Ejecutar entregas con evidencia digital opcional (firma/foto)
Gestionar problemas, reintentos y reprogramaciones
Procesar cancelaciones (dentro de ventana permitida)
Gestionar devoluciones a Stock cuando corresponda
Mantener trazabilidad completa consultable vía API
Generar documentación operativa (etiquetas, actas, POD)
Gestión y Control:
Configuración de zonas de cobertura, vehículos y capacidades
Configuración de tarifas y reglas de cotización
Torre de control y reportes operativos
Administración de usuarios y permisos
Auditoría de operaciones
Integraciones:
API REST con Portal de Compras (cotización, creación, tracking, cancelación)
API REST con Stock (consulta productos, validación reservas)

2.2 LO QUE EL SISTEMA NO HACE ❌
Fuera de Alcance:
❌ Venta de productos (lo hace Portal de Compras)
❌ Gestión de catálogo (lo hace Portal de Compras)
❌ Cobro de envíos (lo cobra Portal de Compras)
❌ Gestión de inventario (lo hace Stock)
❌ Almacenamiento propio (usamos depósitos de Stock)
❌ Sucursales de retiro para clientes (no operamos pick-up points)
❌ Cross-docking o consolidación (retiramos y entregamos directo)
❌ Envíos entre sucursales (no aplica, no hay sucursales)
❌ Logística inversa de cambios comerciales (solo devoluciones por inentregabilidad)
❌ Notificaciones push al cliente final (las envía Portal de Compras)
❌ Gestión de reclamos comerciales (lo gestiona Portal de Compras)
❌ Facturación al cliente (la genera Portal de Compras)

3. ACTORES Y RESPONSABILIDADES
3.1 SISTEMAS EXTERNOS (Integrados vía API)
Portal de Compras:
Solicita cotizaciones antes de la compra
Crea envíos tras confirmación de orden
Consulta estados mediante GET /shipping/{id} (polling)
Solicita cancelaciones (dentro de ventana)
Obtiene POD para mostrar al cliente
Responsable de: liberar reservas en Stock tras cancelación o retiro
Stock:
Expone información de productos (peso, dimensiones, depósito)
Mantiene reservas de mercadería
Libera reservas cuando Portal lo solicita
NO recibe: confirmaciones de retiro físico, notificaciones de devolución

3.2 ROLES INTERNOS
Operación Logística - Base:
Planifica rutas de retiro en depósitos
Asigna envíos a vehículos y conductores
Optimiza hojas de reparto (última milla)
Programa franjas horarias
Monitorea operación en curso
Conductor:
Ejecuta retiros en depósitos de Stock
Ejecuta entregas al cliente (con o sin app móvil)
Captura evidencias (firma digital, fotos) - opcional según implementación
Reporta problemas de entrega con motivo estandarizado
Backoffice de Problemas:
Gestiona envíos no entregados
Corrige datos erróneos (dirección, teléfono)
Reprograma reintentos
Prioriza casos urgentes
Decide devoluciones a Stock
Administrador General:
Configura red logística completa
Define zonas de cobertura y tarifas
Administra vehículos y capacidades
Gestiona usuarios y permisos
Accede a reportes estratégicos y auditoría

4. FLUJO OPERATIVO COMPLETO
4.1 FLUJO PRINCIPAL (Sin Incidencias)
1. COTIZACIÓN PREVIA
   Portal → Logística: POST /shipping/cost
   Logística → Stock: GET /productos/{id} (por cada producto)
   Logística → Portal: Precio + ETA estimado

2. CREACIÓN DE ENVÍO
   Cliente confirma compra en Portal
   Portal → Stock: POST /reservas (reserva productos)
   Portal → Logística: POST /shipping (crea envío, recibe shipping_id)
   Logística → Stock: GET /reservas/{id} (valida reserva activa)
   Logística: Crea envío, estado = "created", calcula ETA

3. PROGRAMACIÓN DE RETIRO
   Operación Base: Agrupa envíos por depósito
   Operación Base: Asigna vehículo + conductor + franja horaria
   Logística: Estado = "pickup_scheduled"

4. RETIRO EN DEPÓSITO
   Conductor: Llega al depósito
   Conductor: Retira mercadería (con/sin escaneo según implementación)
   Conductor: Genera acta de retiro con firma de Stock
   Logística: Estado = "picked_up"
   Portal: Consulta GET /shipping/{id} → ve estado actualizado

5. PLANIFICACIÓN DE ENTREGA
   Operación Base: Asigna a hoja de reparto del día
   Operación Base: Optimiza ruta (múltiples paradas)
   Logística: Estado = "out_for_delivery"

6. EJECUCIÓN DE ENTREGA
   Conductor: Navega a dirección del cliente
   Conductor: Entrega paquete
   Conductor: Captura evidencia (firma/foto - opcional)
   Logística: Estado = "delivered", genera POD
   Portal: Consulta GET /shipping/{id} → ve entrega confirmada

7. CIERRE
   Portal: Actualiza orden como "Entregada"
   Cliente: Consulta tracking + descarga POD (si disponible)
```

---

### 4.2 FLUJOS ALTERNATIVOS (Desvíos)

**A. Cancelación Temprana:**
```
Cliente: Cancela compra
Portal → Logística: POST /shipping/{id}/cancel
Logística: Valida estado = "created" o "pickup_scheduled"
Logística: Estado = "cancelled"
Portal → Stock: DELETE /reservas/{id} (libera reserva)
```

**B. No Entregado (Primer Intento):**
```
Conductor: Llega a dirección → Cliente ausente
Conductor: Marca "delivery_failed - Ausente" + foto evidencia
Logística: Estado = "delivery_failed"
Backoffice: Reprograma para día siguiente
Logística: Estado = "out_for_delivery" (reintento)
```

**C. Corrección de Datos:**
```
Backoffice: Detecta dirección incorrecta
Backoffice: Contacta cliente, corrige datos
Backoffice: Actualiza envío con nueva dirección
Backoffice: Reprograma entrega
```

**D. Devolución a Stock:**
```
Backoffice: Envío con 3 intentos fallidos, inentregable
Backoffice: Marca estado = "returning"
⚠️ Coordinación manual con Stock (email/teléfono)
Conductor: Lleva al depósito, genera acta devolución con firma Stock
Logística: Estado = "returned"
⚠️ Stock reintegra inventario manualmente en su sistema
```

---

## 5. ESTADOS DEL ENVÍO

### 5.1 Estados Principales

| Estado | Descripción | Responsable |
|--------|-------------|-------------|
| **created** | Envío registrado, pendiente de programar retiro | Sistema |
| **pickup_scheduled** | Retiro asignado a vehículo/conductor/franja | Operación Base |
| **picking_up** | Conductor en el depósito (opcional) | Conductor |
| **picked_up** | Mercadería retirada de Stock | Conductor |
| **out_for_delivery** | En ruta hacia cliente | Operación Base |
| **delivered** | Cliente recibió el paquete | Conductor |
| **delivery_failed** | Intento fallido, requiere acción | Conductor |
| **cancelled** | Cancelado antes del retiro | Portal/Sistema |
| **returning** | En tránsito de regreso a Stock | Backoffice |
| **returned** | Devuelto a Stock | Conductor |

---

### 5.2 Transiciones de Estado
```
created → pickup_scheduled → picking_up → picked_up → 
out_for_delivery → delivered ✅

Desvíos:
created → cancelled ❌
pickup_scheduled → cancelled ❌
out_for_delivery → delivery_failed → out_for_delivery (reintento)
delivery_failed → returning → returned ❌
```

---

## 6. COMUNICACIONES ENTRE SUBSISTEMAS

### 6.1 APIs que EXPONEMOS (Logística → Externos)

**Para Portal de Compras:**
```
POST /shipping/cost
  → Cotiza envío
  ← Devuelve precio + ETA

POST /shipping
  → Crea envío post-compra
  ← Devuelve shipping_id + estado + ETA

GET /shipping/{id}
  → Consulta estado y tracking
  ← Devuelve estado actual + historial + ETA

POST /shipping/{id}/cancel
  → Cancela envío (solo si estado permite)
  ← Confirma cancelación

GET /shipping/{id}/pod
  → Obtiene POD (Proof of Delivery)
  ← Devuelve URL del documento
```

**Modelo de comunicación:**
- **NO hay webhooks** implementados
- Portal hace **polling** consultando GET /shipping/{id} periódicamente
- Portal se encarga de actualizar su propia base de datos

---

### 6.2 APIs que CONSUMIMOS (Logística → Externos)

**De Stock:**
```
GET /productos/{id}
  → Consulta peso, dimensiones, depósito de origen
  ← Devuelve características del producto

GET /reservas/{id}?usuarioId={X}
  → Valida existencia y estado de reserva
  ← Devuelve estado + productos reservados
De Portal (indirectamente):
Portal llama a Stock: DELETE /reservas/{id} para liberar reservas
Logística NO llama directamente a Stock para liberar

7. REGLAS DE NEGOCIO CRÍTICAS
7.1 Cotización
✅ Precio = tarifa base + (peso volumétrico × tarifa/kg) + (distancia × tarifa/km)
✅ Peso volumétrico = MAX(peso real, (largo×ancho×alto)/factor)
✅ ETA = próximo slot de retiro + tiempo tránsito + buffer operativo
✅ Cotización válida por tiempo configurable
❌ No cotiza si dirección fuera de zona de cobertura

7.2 Creación de Envío
✅ Solo se crea si existe reserva activa en Stock
✅ ETA inicial considera carga operativa actual
❌ Rechaza si reserva caducó o productos no coinciden
❌ Rechaza si dirección fuera de cobertura
✅ Devuelve shipping_id único al Portal

7.3 Retiro
✅ Retiro debe estar dentro de ventana operativa del depósito
✅ Genera acta de retiro con firma de responsable de Stock
✅ Estado cambia a "picked_up" al confirmar
❌ Stock NO recibe notificación automática del retiro físico

7.4 Planificación de Entrega
✅ Suma de peso/volumen ≤ capacidad del vehículo
✅ Rutas se optimizan por proximidad geográfica (opcional)
✅ Se respetan franjas horarias comprometidas (si hay)
⚠️ Alerta si utilización > 90% de capacidad
❌ Bloquea asignación si excede 100%

7.5 Entrega
✅ Entrega exitosa puede incluir firma digital y/o foto (según implementación)
✅ POD incluye geolocalización si está disponible
✅ "delivery_failed" requiere motivo estandarizado obligatorio
✅ Estado "delivered" disponible para consulta vía API

7.6 Cancelación
✅ Cancelación permitida SOLO si estado = "created" o "pickup_scheduled"
❌ No se puede cancelar si estado ≥ "picking_up"
✅ Portal es responsable de liberar reserva en Stock (DELETE /reservas/{id})
✅ Estado cambia a "cancelled"

7.7 Reintentos
✅ Máximo de intentos configurable (ej: 3)
✅ Ventana de reintento configurable (ej: 5 días desde creación)
⚠️ Alerta si se alcanza máximo de intentos
✅ Backoffice decide: nuevo reintento o devolución

7.8 Devolución
✅ Solo aplica si envío inentregable tras agotar reintentos
✅ Requiere autorización de Backoffice
✅ Genera acta de devolución firmada por Stock
⚠️ Coordinación manual con Stock para reintegrar inventario (no hay API)

8. DOCUMENTOS GENERADOS
Documento
Cuándo
Contenido
Formato
Etiqueta
Al crear envío
ID envío, código barras, dirección
PDF
Acta de Retiro
Al retirar de Stock
Lista productos, firma Stock
PDF
Hoja de Reparto
Al planificar entrega
Paradas ordenadas, contactos
PDF
POD
Al entregar
Firma/foto + geolocalización
PDF + imágenes
Acta de Devolución
Al devolver a Stock
Motivo, firma Stock
PDF


9. RESTRICCIONES Y SUPUESTOS
9.1 Restricciones Técnicas
✅ APIs REST con timeout máximo 10 segundos
✅ Respuesta de cotización < 3 segundos
✅ API de tracking < 500ms
✅ App móvil puede funcionar offline (según implementación)
✅ Retención de datos: mínimo 1 año
9.2 Restricciones Operativas
✅ Solo operamos en zonas configuradas
✅ Solo retiramos de depósitos de Stock
✅ No hacemos cross-docking (retiro y entrega son separados)
✅ No almacenamos mercadería (todo en tránsito)
✅ No hay webhooks (Portal hace polling)
9.3 Supuestos
✅ Portal tiene sistema de notificaciones al cliente final
✅ Portal es responsable de liberar reservas en Stock
✅ Stock mantiene inventario actualizado
✅ Conductores tienen acceso a la operación (app, papel, radio, etc.)
✅ Depósitos de Stock tienen personal en ventanas operativas
✅ Clientes proveen dirección válida al comprar

11. FUERA DE ALCANCE ACTUAL
Limitaciones conocidas:
Con Stock:
🔴 Stock NO tiene endpoint para confirmar retiro físico
🔴 Stock NO tiene endpoint para recibir devoluciones físicas
⚠️ Coordinación manual requerida para devoluciones

12. RESPONSABILIDADES ENTRE SUBSISTEMAS
Portal de Compras
✅ Venta y cobro al cliente
✅ Crear reservas en Stock
✅ Liberar reservas en Stock (tras cancelación o retiro)
✅ Consultar estado de envíos (polling)
✅ Notificar al cliente final
✅ Gestionar reclamos comerciales
Stock
✅ Gestión de inventario
✅ Crear y mantener reservas
✅ Liberar reservas cuando Portal solicita
✅ Exponer información de productos
❌ NO recibe confirmaciones de retiro físico
❌ NO recibe notificaciones de devolución
Logística (este sistema)
✅ Cotizar envíos
✅ Crear y gestionar envíos
✅ Validar reservas en Stock
✅ Coordinar y ejecutar retiros físicos
✅ Planificar y ejecutar entregas
✅ Gestionar problemas y reintentos
✅ Generar documentación operativa
✅ Proveer tracking vía API (polling)
❌ NO libera reservas en Stock (lo hace Portal)
❌ NO notifica automáticamente a Stock retiros/devoluciones
13. COMUNICACIONES ENTRE SUBSISTEMAS
1. Cotización (Pre-compra)
Portal → Logística: POST /shipping/cost (dirección + productos)
Logística → Stock: GET /productos/{id} (consulta peso, dimensiones, almacén por cada producto)
2. Creación de Envío (Post-compra)
Portal → Stock: POST /reservas (crea reserva de productos)
Portal → Logística: POST /shipping (crea envío, recibe shipping_id)
Logística → Stock: GET /reservas/{id}?usuarioId=X (valida que reserva existe y está activa)
3. Tracking (Consulta de estado)
Portal → Logística: GET /shipping/{id} (consulta estado actual + historial de eventos)
Portal realiza polling periódico para actualizar estados
4. Cancelación
Portal → Logística: POST /shipping/{id}/cancel (cancela el envío)
Portal → Stock: DELETE /reservas/{id} (libera la reserva para que mercadería quede disponible)
5. Estados del Envío
Flujo de estados en Logística:
created → pickup_scheduled → picking_up → picked_up → 
out_for_delivery → delivered / delivery_failed / cancelled / returning → returned










14. Backlog de Historias de Usuario - Módulo de Transporte, Logística y Seguimiento

ÉPICAS
EP1 - Cotización Previa
Descripción: Calcular costos y tiempos de entrega consultando datos de Stock (peso, dimensiones, depósito de origen) y distancia a destino, devolviendo precio y ETA al Portal de Compras antes de que el cliente confirme la compra.
Métricas clave:
Tiempo de respuesta de cotización (< 3 seg)
% cotizaciones exitosas vs fallidas
Diferencia entre ETA cotizado vs real

EP2 - Creación de Envío Post-Compra
Descripción: Recibir orden confirmada del Portal de Compras, validar reserva activa en Stock, crear registro de envío con ETA inicial y devolver shipping_id al Portal.
Métricas clave:
% envíos creados correctamente vs rechazados
Tiempo entre compra y creación de envío
% reservas validadas exitosamente

EP3 - Retiro en Depósito de Stock
Descripción: Planificar rutas de retiro, asignar vehículos y conductores, ejecutar retiro con escaneo de productos y generar acta firmada.
Métricas clave:
% retiros en tiempo vs retrasados
Tiempo promedio de retiro en depósito
% discrepancias entre reservado y retirado

EP4 - Planificación de Última Milla
Descripción: Asignar envíos retirados a vehículos y turnos, optimizar rutas de entrega considerando capacidad, franjas horarias y proximidad geográfica.
Métricas clave:
% utilización de capacidad vehicular
Cantidad promedio de paradas por ruta
Cumplimiento de franjas horarias prometidas

EP5 - Ejecución de Entrega (App Conductor)
Descripción: Proveer herramienta móvil para que conductores naveguen, contacten clientes, registren entregas exitosas con evidencia digital (firma/foto) o marquen no entregado con motivo estandarizado.
Métricas clave:
Tasa de éxito en primer intento
Tiempo promedio por entrega
% uso de evidencia digital (firma/foto)

EP6 - Gestión de Problemas y Reintentos
Descripción: Administrar envíos no entregados, corregir datos erróneos, reprogramar entregas y priorizar reintentos.
Métricas clave:
% envíos resueltos en primer reintento
Tiempo promedio de resolución de incidencias
Cantidad de reintentos por envío

EP7 - Cancelación y Devolución
Descripción: Permitir cancelación de envíos antes del retiro y gestionar devoluciones cuando corresponda retornar mercadería al depósito.
Métricas clave:
% cancelaciones dentro de ventana permitida
Tiempo de liberación de reserva post-cancelación
% devoluciones completadas exitosamente

EP8 - Seguimiento, Eventos y Documentos
Descripción: Mantener línea de tiempo detallada de cada envío consultable vía API, recalcular ETAs cuando ocurren demoras, generar y compartir documentos operativos (etiquetas, actas, POD).
Métricas clave:
Tiempo de respuesta de API de tracking (< 500ms)
Precisión de ETAs actualizados
% documentos generados sin error

EP9 - Torre de Control y Reportes
Descripción: Generar reportes de desempeño, KPIs operativos y auditoría completa por envío.
Métricas clave:
Tiempo de detección de alertas críticas
% cobertura de trazabilidad completa
Tiempo de generación de reportes analíticos

EP10 - Configuración Operativa y Seguridad
Descripción: Administrar maestros de zonas/CPs, vehículos, capacidades, reglas de cotización, motivos de no entrega, roles y permisos de usuarios según nivel de acceso.
Métricas clave:
% actualizaciones de configuración sin incidentes
Tiempo de onboarding de nuevos usuarios
% auditorías de acceso exitosas

HISTORIAS DE USUARIO POR ÉPICA
EP1 - Cotización Previa
HU-ID: EP1-HU1
 Como Portal de Compras
 Quiero solicitar cotización enviando dirección de entrega y lista de productos
 Para ofrecer al cliente el costo y tiempo de envío antes de confirmar la compra
Criterios de Aceptación:
Recibe JSON con dirección completa (calle, número, CP, ciudad) + array de productos (id, cantidad)
Valida formato de dirección y existencia de productos
Devuelve error 400 si faltan datos obligatorios o formato incorrecto
Timeout de 5 segundos, devuelve error 504 si no responde

HU-ID: EP1-HU2
 Como Módulo de Logística
 Quiero consultar a Stock peso, dimensiones y depósito de origen por cada producto
 Para calcular capacidad necesaria y distancia real del retiro
Criterios de Aceptación:
Llama API de Stock por cada producto único en la solicitud
Recibe peso (kg), dimensiones (cm³) y código de depósito
Cachea respuesta de Stock por 10 minutos para mismo producto
Si Stock no responde en 2 seg, usa valores por defecto y marca cotización como "estimada"

HU-ID: EP1-HU3
 Como Módulo de Logística
 Quiero calcular precio de envío según peso volumétrico, distancia y servicio seleccionado
 Para devolver tarifa correcta al Portal de Compras
Criterios de Aceptación:
Calcula peso volumétrico = (largo × ancho × alto) / factor configurado
Usa el mayor entre peso real y volumétrico
Aplica tarifa base + tarifa por kg/km según reglas configuradas por servicio
Redondea precio a 2 decimales
Devuelve precio en moneda configurada (ej: ARS)

HU-ID: EP1-HU4
 Como Módulo de Logística
 Quiero estimar ETA sumando tiempo de retiro + tiempo de entrega
 Para informar al cliente cuándo recibirá su pedido
Criterios de Aceptación:
Tiempo de retiro = próxima ventana disponible en depósito de Stock
Tiempo de entrega = distancia / velocidad promedio + tiempo de espera por zona
Considera días hábiles y horarios operativos configurados
Devuelve ETA en formato ISO 8601 (fecha y hora)
Marca ETA como "estimado" si usó valores por defecto

EP2 - Creación de Envío Post-Compra
HU-ID: EP2-HU1
 Como Portal de Compras
 Quiero crear envío tras confirmación de compra enviando orden, servicio y datos del cliente
 Para iniciar el proceso logístico automáticamente
Criterios de Aceptación:
Recibe: ID orden, servicio contratado, dirección entrega completa, contacto (nombre, teléfono, email), lista de productos
Genera ID único de envío (ej: ENV-20250101-00001)
Devuelve ID de envío, estado inicial "created" y ETA
Almacena timestamp de creación

HU-ID: EP2-HU2
 Como Módulo de Logística
 Quiero validar que existe reserva activa en Stock para los productos del envío
 Para asegurar que la mercadería está disponible antes de planificar retiro
Criterios de Aceptación:
Consulta API de Stock con ID de reserva
Verifica estado de reserva = "confirmado" y productos coincidentes
Si reserva no existe o caducó, rechaza creación con error 422
Si reserva válida, continúa con creación de envío
Registra ID de reserva asociado al envío

HU-ID: EP2-HU3
 Como Módulo de Logística
 Quiero calcular ETA inicial basado en disponibilidad de retiro y capacidad de entrega
 Para comprometer fecha realista con el cliente
Criterios de Aceptación:
Consulta próxima ventana de retiro disponible en depósito
Estima tiempo de entrega según zona y carga operativa actual
Suma buffers configurados (ej: +4hs por procesamiento)
Almacena ETA en BD con timestamp de cálculo
Permite recalcular ETA si condiciones cambian

EP3 - Retiro en Depósito de Stock
HU-ID: EP3-HU1
 Como Operación Logística - Base
 Quiero ver envíos listos para retirar agrupados por depósito
 Para planificar rutas de retiro eficientes
Criterios de Aceptación:
Lista muestra envíos con estado "created"
Agrupa por depósito de origen
Muestra: dirección depósito, cantidad de envíos, peso/volumen total
Permite seleccionar múltiples envíos para asignar a una misma ruta
Filtra por rango de fechas de compromiso de retiro

HU-ID: EP3-HU2
 Como Operación Logística - Base
 Quiero asignar envíos a vehículo, conductor y franja horaria de retiro
 Para coordinar la visita al depósito
Criterios de Aceptación:
Selecciona vehículo de lista activa con capacidad suficiente
Asigna conductor de lista disponible
Define franja horaria dentro de ventanas operativas del depósito
Valida que capacidad no exceda límite del vehículo
Cambia estado de envíos a "pickup_scheduled"

HU-ID: EP3-HU3
 Como Conductor
 Quiero ver en mi app móvil la hoja de retiro con dirección y lista de envíos
 Para saber qué retirar en cada depósito
Criterios de Aceptación:
App muestra: dirección del depósito, contacto, horario de retiro
Lista de envíos asignados con: ID envío, ID orden, productos, cantidad, peso
Opción de navegación GPS al depósito
Opción de llamar al contacto del depósito
Estado de cada envío visible (ej: pendiente de retiro)

HU-ID: EP3-HU4
 Como Conductor
 Quiero escanear código de barras de carta de porte
 Para confirmar que estoy retirando lo correcto 
Criterios de Aceptación:
App permite escanear código de barras usando cámara del dispositivo
Valida que código coincida con productos del envío
Marca producto como escaneado (checkmark verde)
Permite ingreso manual si código no escanea
Alerta si escanea producto no esperado
Muestra progreso: X de Y productos escaneados
cambiar estado a que el pedido esta retirado y en camino

EP4 - Planificación de Última Milla
HU-ID: EP4-HU1
 Como Operación Logística - Base
 Quiero ver envíos pendientes de entrega
 Para planificar entregas del día siguiente
Criterios de Aceptación:
Lista envíos con estado "picked_up"
Filtra por zona de entrega (CP o polígono)
Muestra: ID envío, dirección, peso, volumen, ETA comprometido
Ordena por urgencia (ETA más cercano primero)
Permite selección múltiple para asignar en lote

HU-ID: EP4-HU2
 Como Operación Logística - Base
 Quiero asignar envíos a vehículo y turno considerando capacidad máxima
 Para evitar sobrecarga y optimizar recursos
Criterios de Aceptación:
Selecciona vehículo y turno (mañana/tarde/noche)
Sistema valida capacidad: suma peso y volumen de envíos ≤ capacidad vehículo
Alerta si asignación excede 90% de capacidad
Bloquea asignación si excede 100%
Cambia estado de envíos a "out_for_delivery" al confirmar

HU-ID: EP4-HU5
 Como Conductor
 Quiero ver en app mi hoja de reparto con orden de paradas
 Para ejecutar las entregas eficientemente
Criterios de Aceptación:
Lista de paradas numeradas en orden sugerido
Para cada parada: dirección, contacto, teléfono, referencias, horario preferido
Mapa con ruta trazada
Opción de navegación GPS paso a paso
Indicador de progreso: X de Y entregas completadas

EP5 - Ejecución de Entrega (App Conductor)
HU-ID: EP5-HU1
 Como Conductor
 Quiero ver detalle de cada parada al llegar
 Para confirmar datos y contactar al cliente
Criterios de Aceptación:
Al tocar parada muestra: dirección completa, piso/depto, referencias
Nombre del destinatario, teléfono, email
Productos a entregar, cantidad de bultos
Instrucciones especiales (ej: "portero eléctrico código 123")
Botones: Iniciar navegación, Llamar cliente, Marcar entregado, No entregado

HU-ID: EP5-HU2
 Como Conductor
 Quiero marcar entrega como "Entregado"
 Para reportar que un pedido a sido entregado
Criterios de Aceptación:
Cambia estado a "entregado"

HU-ID: EP5-HU3
 Como Conductor
 Quiero marcar entrega como "No entregado" seleccionando motivo estandarizado
 Para reportar claramente por qué no pude completar la entrega
Criterios de Aceptación:
Lista de motivos predefinidos: Ausente, Dirección incorrecta, Rechazó el paquete, Zona insegura, Problemas con producto, Horario cerrado, Otro
Campo opcional de observaciones (máx 500 caracteres)
Permite tomar foto de evidencia (ej: negocio cerrado)
Captura geolocalización y timestamp
Cambia estado a "delivery_failed"
Envío vuelve a bandeja de problemas

EP6 - Gestión de Problemas y Reintentos
HU-ID: EP6-HU1
 Como Backoffice de Problemas
 Quiero ver bandeja de envíos con estado "delivery_failed"
 Para priorizar resolución de incidencias
Criterios de Aceptación:
Lista envíos con estado "delivery_failed"
Columnas: ID envío, orden, motivo, intentos previos, días desde creación, ETA vencido (sí/no)
Filtra por motivo de no entrega
Ordena por urgencia (ETA vencido primero)
Indicador visual de envíos críticos (>2 intentos fallidos)

HU-ID: EP6-HU3
 Como Backoffice de Problemas
 Quiero reprogramar envío para reintento en fecha y franja específica
 Para coordinar con disponibilidad del cliente
Criterios de Aceptación:
Selecciona fecha futura (dentro de ventana permitida, ej: 5 días)
Selecciona franja horaria (mañana/tarde)
Cambia estado a "out_for_delivery"
Envío entra a planificación del día seleccionado
Recalcula y almacena nuevo ETA
Registra número de reintento

EP7 - Cancelación y Devolución
HU-ID: EP7-HU1
 Como Portal de Compras
 Quiero cancelar un envío antes de que sea retirado del depósito
 Para permitir al cliente desistir de la compra sin impacto logístico
Criterios de Aceptación:
API acepta solicitud de cancelación si estado = "created" o "pickup_scheduled"
Rechaza cancelación si estado >= "picking_up" (código 422)
Cambia estado a "cancelled"
Response incluye: shipping_id, status: "cancelled", cancelled_at

HU-ID: EP7-HU3
 Como Operación Logística - Base
 Quiero remover envíos cancelados de hojas de retiro programadas
 Para no gastar recursos en retiros innecesarios
Criterios de Aceptación:
Envíos cancelados desaparecen automáticamente de vista de planificación
Si estaba en hoja de retiro ya generada, marca como "cancelado" pero mantiene en histórico
Ajusta capacidad utilizada del vehículo
Notifica a conductor si hoja ya estaba asignada

HU-ID: EP7-HU4
 Como Backoffice de Problemas
 Quiero marcar envío como "devolver a Stock" cuando no es entregable
 Para retornar mercadería al depósito
Criterios de Aceptación:
Opción disponible si estado = "delivery_failed" y se agotaron reintentos
Cambia estado a "returning"
Genera orden de devolución con: envío, motivo, depósito destino
Asigna a ruta de retorno al depósito
⚠️ Coordinación manual con Stock para recepción física (fuera del sistema)

HU-ID: EP7-HU5
 Como Conductor
 Quiero confirmar devolución al depósito
 Para cerrar el ciclo de la devolución
Criterios de Aceptación:
Similar a retiro: escanea productos, genera acta de devolución
Responsable de Stock firma acta
Cambia estado final a "returned" con timestamp
Genera acta de devolución en PDF
⚠️ Coordinación manual con Stock para reintegrar inventario

EP8 - Seguimiento, Eventos y Documentos
HU-ID: EP8-HU1
 Como Portal de Compras
 Quiero consultar estado actual y línea de tiempo de un envío
 Para mostrar tracking detallado al cliente
Criterios de Aceptación:
API GET /shipping/{id} devuelve: estado actual, ETA, eventos históricos
Cada evento incluye: tipo, timestamp, descripción, ubicación (si aplica)
Eventos mínimos: created, pickup_scheduled, picked_up, out_for_delivery, delivered
Formato JSON estándar, respuesta < 500ms

HU-ID: EP8-HU3
 Como Módulo de Logística
 Quiero recalcular y actualizar ETA cuando ocurren demoras
 Para mantener expectativas realistas con el cliente
Criterios de Aceptación:
Recalcula ETA si: retiro se retrasa >2hs, envío no entregado, reprogramado
Nuevo ETA considera: tiempo transcurrido, próxima ventana disponible, carga operativa actual
Almacena historial de cambios de ETA en BD
Portal verá nuevo ETA al consultar GET /shipping/{id}

HU-ID: EP8-HU4
 Como Sistema
 Quiero generar etiqueta de envío
 Para identificar un envío
Criterios de Aceptación:
Genera etiqueta al crear envío
Almacena URL de etiqueta en registro del envío

HU-ID: EP8-HU5
 Como Sistema
 Quiero generar acta de retiro con datos completos y firma digital
 Para documentar responsabilidad en transferencia de mercadería
Criterios de Aceptación:
Genera al confirmar retiro
Incluye: fecha/hora, depósito origen, conductor, vehículo, lista detallada de productos/cantidades
Área de firma digital del responsable de Stock
Logo empresa, número de acta único
PDF almacenado con acceso público mediante URL

HU-ID: EP8-HU6
 Como Sistema
 Quiero generar POD (Proof of Delivery) con fotos del comprobante de entrega
 Para evidenciar entrega exitosa
Criterios de Aceptación:
Genera al marcar entregado
Incluye: fecha/hora entrega, dirección, nombre receptor, firma digital, hasta 3 fotos
Geolocalización de punto de entrega
Marca de agua con timestamp en imágenes
PDF + imágenes originales accesibles por URL

EP9 - Torre de Control y Reportes
HU-ID: EP9-HU2
 Como Administrador General
 Quiero generar reporte de desempeño operativo con KPIs principales
 Para analizar eficiencia y tomar decisiones estratégicas
Criterios de Aceptación:
KPIs: Tasa de éxito primer intento, Tiempo promedio retiro-entrega, Cumplimiento de ETA (%), Envíos entregados vs meta, Motivos top de no entrega
Filtros: rango de fechas, sucursal, servicio
Visualizaciones: gráficos de barra, torta, línea de tendencia
Exportable a Excel y PDF
Genera en < 10 segundos para períodos de hasta 30 días

HU-ID: EP9-HU3
 Como Administrador General
 Quiero ver reporte de trazabilidad completa de un envío específico
 Para auditar y resolver reclamos
Criterios de Aceptación:
Búsqueda por: ID envío, ID orden, teléfono cliente
Muestra: todos los eventos con timestamp y usuario, cambios de estado, reasignaciones, documentos generados (etiqueta, actas, POD)
Enlaces a todos los documentos
Historial de comunicaciones con Stock y Portal
Exportable como PDF con fines legales

EP10 - Configuración Operativa y Seguridad
HU-ID: EP10-HU1
 Como Administrador General
 Quiero configurar zonas de cobertura con polígonos geográficos o rangos de CP
 Para definir áreas donde operamos
Criterios de Aceptación:
Interfaz de mapa para dibujar polígonos
Alternativamente: carga CSV con lista de CPs cubiertos
Asigna zona a sucursal responsable
Marca zona como activa/inactiva
Valida dirección contra zonas al crear envío
Rechaza creación si dirección fuera de cobertura

HU-ID: EP10-HU2
 Como Administrador General
 Quiero registrar vehículos con capacidad máxima (peso y volumen)
 Para controlar asignaciones y evitar sobrecarga
Criterios de Aceptación:
Formulario: patente, tipo (moto/van/camión), capacidad peso (kg), volumen (m³), sucursal asignada
Estado: activo/mantenimiento/inactivo
Valida unicidad de patente
Histórico de cambios de estado
No permite asignar envíos a vehículos inactivos

HU-ID: EP10-HU3
 Como Administrador General
 Quiero definir ventanas operativas por depósito y sucursal
 Para coordinar horarios de retiro y entrega
Criterios de Aceptación:
Configura por ubicación: días de semana, horario inicio/fin
Permite definir franjas: mañana (8-13h), tarde (13-18h), noche (18-21h)
Excepciones: feriados sin operación
Valida que asignaciones respeten ventanas
Alertas si se intenta programar fuera de horario

HU-ID: EP10-HU4
 Como Administrador General
 Quiero configurar reglas de cotización por servicio (express/standard/económico)
 Para calcular precios diferenciados
Criterios de Aceptación:
Por servicio: tarifa base, tarifa por kg, tarifa por km, factor volumétrico
Recargos opcionales: zona remota (+%), entrega urgente (+%), seguro por valor declarado
Vigencia desde/hasta fecha
Permite múltiples reglas activas (usa la más reciente por defecto)
Simulador para probar cálculos con datos de ejemplo

HU-ID: EP10-HU5
 Como Administrador General
 Quiero mantener catálogo de motivos estandarizados de no entrega
 Para facilitar análisis de causas raíz
Criterios de Aceptación:
Lista configurable de motivos: Ausente, Dirección incorrecta, Rechazó, Zona insegura, etc.
Activo/inactivo por motivo
Orden de visualización en app conductor
Estadística: frecuencia
de uso de cada motivo
Permite agregar nuevos motivos con aprobación

HU-ID: EP10-HU6
 Como Administrador General
 Quiero definir roles y permisos por funcionalidad
 Para controlar acceso según responsabilidad de cada usuario
Criterios de Aceptación:
Roles predefinidos: Admin General, Operación Base, Conductor, Backoffice Problemas
Permisos granulares: ver envíos, crear, editar, cancelar, asignar vehículos, configurar, ver reportes
Asigna rol a usuario al crear cuenta
Usuario puede tener múltiples roles
Valida permisos en cada acción (backend y frontend)

HU-ID: EP10-HU7
 Como Administrador General
 Quiero crear y editar usuarios con sus datos de acceso
 Para administrar el equipo operativo
Criterios de Aceptación:
Formulario: nombre, email, teléfono, rol, sucursal asignada
Genera contraseña temporal al crear (envía por email)
Obliga cambio de contraseña en primer login
Permite desactivar usuario (no elimina historial)
Log de auditoría: quién creó/modificó a quién y cuándo

HU-ID: EP10-HU10
 Como Sistema
 Quiero integrarme con Portal de Compras y Stock mediante APIs REST autenticadas
 Para intercambiar información de forma segura y confiable
Criterios de Aceptación:
Autenticación: API keys o OAuth 2.0
Endpoints documentados en OpenAPI/Swagger
Versionado de API (v1, v2) para cambios no breaking
Rate limiting: máx 1000 req/min por sistema externo
Logs de todas las llamadas entrantes/salientes
Timeout: 10 seg, responde 504 si excede
Retry automático con backoff exponencial en llamadas salientes

HU-ID: EP10-HU8
 Como Administrador General
 Quiero registrar tipos de transporte disponibles (camión, avión, tren, barco)
 Para ofrecer diferentes servicios de envío con características y tiempos diferenciados
Criterios de Aceptación:
Formulario: nombre (ej: "Camión"), código (ej: "road"), descripción
Velocidad promedio (km/h) para cálculo de ETA
Días estimados de entrega (rango: ej: "3-7 días")
Estado: activo/inactivo
Permite asociar tipo de transporte a servicios de cotización (express/standard/económico)
Valida unicidad de código
Lista muestra todos los tipos configurados con opción de editar/desactivar
No permite eliminar si hay envíos asociados, solo desactivar








15. LISTADO BREVE DE HISTORIAS DE USUARIO POR ÉPICA
EP1 - Cotización Previa
EP1-HU1: Portal solicita cotización con dirección y productos
EP1-HU2: Consultar peso/dimensiones/depósito a Stock
EP1-HU3: Calcular precio por peso volumétrico y distancia
EP1-HU4: Estimar ETA (retiro + entrega)

EP2 - Creación de Envío Post-Compra
EP2-HU1: Portal crea envío post-compra con datos completos
EP2-HU2: Validar reserva activa en Stock
EP2-HU3: Calcular ETA inicial considerando carga operativa

EP3 - Retiro en Depósito de Stock
EP3-HU1: Ver envíos listos para retirar agrupados por depósito
EP3-HU2: Asignar vehículo/conductor para retiro en depósito
EP3-HU3: Conductor ve hoja de retiro en app móvil
EP3-HU4: Escanear código de barras y cambiar estado a retirado

EP4 - Planificación de Última Milla
EP4-HU1: Ver envíos pendientes de entrega
EP4-HU2: Planificar hoja de reparto validando capacidad
EP4-HU5: Conductor ve hoja de reparto con orden de paradas

EP5 - Ejecución de Entrega (App Conductor)
EP5-HU1: Ver detalle completo de cada parada
EP5-HU2: Marcar entrega como "Entregado"
EP5-HU3: Marcar "No entregado" con motivo estandarizado

EP6 - Gestión de Problemas y Reintentos
EP6-HU1: Ver bandeja de envíos "delivery_failed"
EP6-HU3: Reprogramar envío para reintento

EP7 - Cancelación y Devolución
EP7-HU1: Portal cancela envío antes del retiro
EP7-HU3: Remover envíos cancelados de hojas de retiro
EP7-HU4: Marcar envío como "devolver a Stock"
EP7-HU5: Conductor confirma devolución al depósito

EP8 - Seguimiento, Eventos y Documentos
EP8-HU1: Portal consulta estado y línea de tiempo
EP8-HU3: Recalcular ETA cuando ocurren demoras
EP8-HU4: Generar etiqueta de envío
EP8-HU5: Generar acta de retiro con firma digital
EP8-HU6: Generar POD con fotos del comprobante

EP9 - Torre de Control y Reportes
EP9-HU2: Reporte de desempeño operativo con KPIs
EP9-HU3: Reporte de trazabilidad completa de envío

EP10 - Configuración Operativa y Seguridad
EP10-HU1: Configurar zonas de cobertura (polígonos o CPs)
EP10-HU2: Registrar vehículos con capacidad máxima
EP10-HU3: Definir ventanas operativas por depósito/sucursal
EP10-HU4: Configurar reglas de cotización por servicio
EP10-HU5: Mantener catálogo de motivos de no entrega
EP10-HU6: Definir roles y permisos
EP10-HU7: Crear y editar usuarios
EP10-HU8: Registrar tipos de transporte disponibles
EP10-HU10: Integración con APIs REST autenticadas
















16. ORDEN DE REALIZACIÓN DE HISTORIAS DE USUARIO

📋 SECUENCIA LÓGICA (1-33)
EP10-HU6 - Definir roles y permisos
EP10-HU7 - Crear y editar usuarios
EP10-HU10 - Integración con APIs REST autenticadas
EP10-HU1 - Configurar zonas de cobertura
EP10-HU8 - Registrar tipos de transporte disponibles
EP10-HU4 - Configurar reglas de cotización por servicio
EP10-HU2 - Registrar vehículos con capacidad máxima
EP10-HU3 - Definir ventanas operativas por depósito/sucursal
EP10-HU5 - Mantener catálogo de motivos de no entrega
EP1-HU1 - Portal solicita cotización con dirección y productos
EP1-HU2 - Consultar peso/dimensiones/depósito a Stock
EP1-HU3 - Calcular precio por peso volumétrico y distancia
EP1-HU4 - Estimar ETA (retiro + entrega)
EP2-HU1 - Portal crea envío post-compra con datos completos
EP2-HU2 - Validar reserva activa en Stock
EP2-HU3 - Calcular ETA inicial considerando carga operativa
EP8-HU4 - Generar etiqueta de envío
EP8-HU1 - Portal consulta estado y línea de tiempo
EP7-HU1 - Portal cancela envío antes del retiro
EP7-HU3 - Remover envíos cancelados de hojas de retiro
EP3-HU1 - Ver envíos listos para retirar agrupados por depósito
EP3-HU2 - Asignar vehículo/conductor para retiro en depósito
EP8-HU5 - Generar acta de retiro
EP4-HU1 - Ver envíos pendientes de entrega
EP4-HU2 - Planificar hoja de reparto validando capacidad
EP5-HU2 - Marcar entrega como "Entregado"
EP5-HU3 - Marcar "No entregado" con motivo estandarizado
EP6-HU1 - Ver bandeja de envíos "delivery_failed"
EP6-HU3 - Reprogramar envío para reintento
EP8-HU3 - Recalcular ETA cuando ocurren demoras
EP7-HU4 - Marcar envío como "devolver a Stock"
EP9-HU2 - Reporte de desempeño operativo con KPIs
EP9-HU3 - Reporte de trazabilidad completa de envío
EP3-HU3 - Conductor ve hoja de retiro en app móvil
EP3-HU4 - Escanear código de barras y cambiar estado a retirado
EP4-HU5 - Conductor ve hoja de reparto con orden de paradas
EP5-HU1 - Ver detalle completo de cada parada
EP8-HU6 - Generar POD con fotos del comprobante
EP7-HU5 - Conductor confirma devolución al depósito

