import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      service: 'stock-integration-service',
      version: '1.0.0',
      description: 'HTTP client service for Stock module integration',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3002,
    };
  }
}
