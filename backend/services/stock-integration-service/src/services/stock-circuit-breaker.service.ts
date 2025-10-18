import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

@Injectable()
export class StockCircuitBreakerService {
  private readonly logger = new Logger(StockCircuitBreakerService.name);
  
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(private configService: ConfigService) {
    this.threshold = this.configService.get<number>('STOCK_CIRCUIT_BREAKER_THRESHOLD', 5);
    this.timeout = this.configService.get<number>('STOCK_CIRCUIT_BREAKER_TIMEOUT', 30000);
    
    this.logger.log(`Circuit Breaker initialized - Threshold: ${this.threshold}, Timeout: ${this.timeout}ms`);
  }

  /**
   * Verifica si el circuit breaker está abierto
   */
  isOpen(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.transitionToHalfOpen();
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Registra un éxito y resetea el contador de fallos
   */
  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.transitionToClosed();
    }
    
    this.failureCount = 0;
    this.logger.debug(`Success recorded. Failure count reset to 0. State: ${this.state}`);
  }

  /**
   * Registra un fallo y actualiza el estado si es necesario
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    this.logger.warn(`Failure recorded. Count: ${this.failureCount}/${this.threshold}. State: ${this.state}`);
    
    if (this.failureCount >= this.threshold) {
      this.transitionToOpen();
    }
  }

  /**
   * Obtiene el estado actual del circuit breaker
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Obtiene el conteo actual de fallos
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Obtiene el tiempo del último fallo
   */
  getLastFailureTime(): number {
    return this.lastFailureTime;
  }

  /**
   * Resetea el circuit breaker a estado CLOSED
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.logger.log('Circuit breaker reset to CLOSED state');
  }

  /**
   * Transición a estado OPEN
   */
  private transitionToOpen(): void {
    const previousState = this.state;
    this.state = 'OPEN';
    this.logger.error(
      `Circuit breaker transitioned from ${previousState} to OPEN. ` +
      `Failure count: ${this.failureCount}/${this.threshold}`
    );
  }

  /**
   * Transición a estado HALF_OPEN
   */
  private transitionToHalfOpen(): void {
    const previousState = this.state;
    this.state = 'HALF_OPEN';
    this.logger.warn(
      `Circuit breaker transitioned from ${previousState} to HALF_OPEN. ` +
      `Testing if service is available again.`
    );
  }

  /**
   * Transición a estado CLOSED
   */
  private transitionToClosed(): void {
    const previousState = this.state;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.logger.log(
      `Circuit breaker transitioned from ${previousState} to CLOSED. ` +
      `Service is healthy again.`
    );
  }

  /**
   * Obtiene estadísticas del circuit breaker
   */
  getStats(): {
    state: CircuitBreakerState;
    failureCount: number;
    threshold: number;
    lastFailureTime: number;
    timeSinceLastFailure: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.threshold,
      lastFailureTime: this.lastFailureTime,
      timeSinceLastFailure: Date.now() - this.lastFailureTime,
    };
  }
}
