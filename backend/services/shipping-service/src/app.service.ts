import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      service: 'Shipping Service',
      version: '1.0.0',
      description: 'Core shipping and logistics operations',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3001,
    };
  }
}
