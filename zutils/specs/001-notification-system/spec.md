# Especificación: Sistema de Notificaciones

## Resumen
Implementar un sistema de notificaciones para informar a los usuarios sobre cambios en el estado de sus envíos.

## Objetivos
- Notificar automáticamente cambios de estado de envíos
- Soporte para múltiples canales (email, SMS, push)
- Configuración personalizable por usuario
- Historial de notificaciones

## User Stories

### US001: Notificación de Cambio de Estado
**Como** usuario del sistema  
**Quiero** recibir notificaciones cuando cambie el estado de mi envío  
**Para** mantenerme informado del progreso de mi pedido

**Criterios de Aceptación:**
- [ ] Se envía notificación automática al cambiar estado
- [ ] La notificación incluye el nuevo estado y timestamp
- [ ] Se registra en el historial de notificaciones
- [ ] Se respeta la configuración de preferencias del usuario

### US002: Configuración de Preferencias
**Como** usuario del sistema  
**Quiero** configurar mis preferencias de notificación  
**Para** recibir solo las notificaciones que me interesan

**Criterios de Aceptación:**
- [ ] Puedo habilitar/deshabilitar notificaciones por canal
- [ ] Puedo configurar qué estados me interesan
- [ ] Puedo establecer horarios de "no molestar"
- [ ] Los cambios se aplican inmediatamente

## Requisitos Técnicos

### Backend
- Nuevo módulo `notifications` en NestJS
- Servicio de notificaciones con inyección de dependencias
- Integración con servicios de email (SendGrid/SES)
- Base de datos: tabla `notifications` y `notification_preferences`
- Eventos asíncronos para cambios de estado

### Frontend (futuro)
- API endpoints para gestión de preferencias
- WebSocket para notificaciones en tiempo real
- Interfaz de configuración de preferencias

## Consideraciones de Implementación
- Usar EventEmitter de NestJS para eventos
- Implementar queue system para notificaciones masivas
- Rate limiting para evitar spam
- Logs detallados para debugging
- Tests unitarios y de integración

## Dependencias
- Módulo shipping existente
- Servicio de usuarios (futuro)
- Servicios de terceros para email/SMS
