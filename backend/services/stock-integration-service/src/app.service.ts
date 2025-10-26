import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      service: 'Stock Integration Service',
      version: '1.0.0',
      description: 'HTTP client service for Stock module integration',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3002,
    };
  }
}
