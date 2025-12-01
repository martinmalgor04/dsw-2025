import { Module, OnModuleDestroy } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServiceRegistry } from './service-registry';
import { ServiceFacade } from './service-facade';
import { ProxyController } from './proxy.controller';
import { DocsController } from './docs.controller';

/**
 * CoreModule - Módulo central del Operator Interface Service
 *
 * Componentes:
 * - ServiceRegistry: Service Discovery dinámico
 * - ServiceFacade: Patrón Facade para orquestar servicios
 * - ProxyController: Router inteligente con auto-discovery
 * - DocsController: Expone esquemas para Swagger (no maneja tráfico real)
 *
 * Arquitectura:
 * ```
 * Request → ProxyController
 *             ↓
 *         ServiceFacade
 *             ↓
 *         ServiceRegistry (descubre servicio)
 *             ↓
 *         Target Service (:3001, :3003, etc)
 * ```
 */
@Module({
  imports: [HttpModule],
  controllers: [DocsController, ProxyController], // DocsController antes para evitar conflictos (aunque tiene prefijo)
  providers: [ServiceRegistry, ServiceFacade],
  exports: [ServiceRegistry, ServiceFacade],
})
export class CoreModule implements OnModuleDestroy {
  constructor(private serviceRegistry: ServiceRegistry) {}

  /**
   * Limpia recursos cuando el módulo se destruye
   */
  onModuleDestroy() {
    this.serviceRegistry.destroy();
  }
}
