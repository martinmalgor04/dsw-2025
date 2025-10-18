import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      service: 'Config Service',
      version: '1.0.0',
      description: 'Configuration service for transport methods and coverage zones',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3003,
    };
  }
}