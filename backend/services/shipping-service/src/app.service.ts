import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      service: 'shipping-service',
      version: '1.0.0',
      description: 'Core shipping and logistics operations',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3001,
    };
  }
}
